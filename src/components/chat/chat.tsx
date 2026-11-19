import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import "./chat.css";

import { useSelector, useDispatch } from "react-redux";

import { RootState, AppDispatch } from "../store/store";

import chatImage from "../../assets/chatImage.jpg";


import MessageEye from "../images/MessageEye.tsx";

import { ReplyIcon } from "../images/MessageMenuIcons";

import { useNotify } from "../hooks/useNotify";

import {
  onAddMessage,
  ChatMessage,
  onSetChat,
  onSetCurrentChat,
  onUpdateMessage,
  onDeleteMessage,
  onSetChatReads,
} from "../reduser/reduser";

import {
  subscribeToChat,
  subscribeToTyping,
  subscribeToMessageUpdates,
  subscribeToReads,
} from "../socket/socket";

import MessageMenu from "../menus/MessageMenu";

import MiniLoading from "../animations/miniLoading/MiniLoading.tsx";

import { avatarUrl, handleAvatarError } from "../avatarEditor/avatarUrl.ts";

/**
 * While the message box is open (focused), "typing…" is sent again this often,
 * so the other person keeps seeing it (their screen hides it after 6s of silence).
 */
const TYPING_REPEAT_MS = 4000;

/**
 * Tells the server you started/stopped typing: POST /typing.
 * The server passes it on over the WebSocket to everyone in the chat
 * (/topic/chat/{chatId}/typing), the same way new messages are sent.
 * It lives here, not in socket.tsx, so it works whatever version of
 * socket.tsx you have.
 */
function sendTyping(chatId: number, userId: number, typing: boolean) {
  fetch(`${import.meta.env.VITE_SERVER_URL}/typing`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, userId, typing }),
    keepalive: true, // still sent if you close the tab while typing
  })
    .then((response) => {
      if (!response.ok) {
        console.warn(`[FunChat] the server answered ${response.status} to /typing`);
      }
    })
    .catch((error) => {
      console.warn("[FunChat] couldn't send typing:", error);
    });
}

/**
 * Tells the server "I've seen everything up to messageId in this chat",
 * so the sender's check marks turn into "seen".
 */
function sendRead(chatId: number, userId: number, messageId: number) {
  fetch(`${import.meta.env.VITE_SERVER_URL}/messages/markRead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, userId, messageId }),
  }).catch((error) => {
    console.warn("[FunChat] couldn't mark messages as read:", error);
  });
}

/** hold a message this long on a phone to open its menu */
const LONG_PRESS_MS = 450;

/** moving the finger further than this cancels the long press (it's a scroll) */
const LONG_PRESS_MOVE_PX = 10;

/** the message box grows up to this height, then scrolls */
const MAX_INPUT_HEIGHT = 160;

const ChatGretting: React.FC = () => {
  const texts = useSelector((state: RootState) => state.reduser.texts);

  return (
    <div className="gretting">
      <div className="createChatMessage">{texts.createChatText}</div>

      <img className="chatImage" draggable="false" src={chatImage} alt="" />
    </div>
  );
};

function formatTime(sendTime: string): string {
  const date = new Date(sendTime);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** messages more than this far apart start a new group, even from the same person */
const GROUP_GAP_MS = 5 * 60 * 1000;

/**
 * Are two messages from the same person, sent close together?
 * Compares sender ids (numbers), not the sender objects: every message
 * has its own copy of the sender object, so "a.sender === b.sender"
 * is always false even when it's the same person.
 */
function sameGroup(a: ChatMessage | undefined, b: ChatMessage | undefined): boolean {
  if (!a || !b) {
    return false;
  }

  if (Number(a.sender.id) !== Number(b.sender.id)) {
    return false;
  }

  const gap = new Date(b.sendTime).getTime() - new Date(a.sendTime).getTime();

  return Number.isNaN(gap) || gap < GROUP_GAP_MS;
}

/** the little "who + what" box at the top of a reply bubble, like Telegram */
const ReplyPreview: React.FC<{
  original: ChatMessage | undefined;
  deletedText: string;
  onClick: () => void;
}> = ({ original, deletedText, onClick }) => (
  <button
    className={`messageReply${original ? "" : " deleted"}`}
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    disabled={!original}
  >
    {original && <span className="messageReplyName">{original.sender.nickname}</span>}
    <span className="messageReplyText">{original ? original.text : deletedText}</span>
  </button>
);

const ChatWithUser: React.FC = () => {
  const texts = useSelector((state: RootState) => state.reduser.texts);

  const chat = useSelector((state: RootState) => state.reduser.chat);

  const chatReads = useSelector((state: RootState) => state.reduser.chatReads);

  const chats = useSelector((state: RootState) => state.reduser.chats);

  const accountId = useSelector((state: RootState) => state.reduser.user.id);

  const savedUserId = useSelector((state: RootState) => state.reduser.userId);

  // always a number (or null), so comparing with message.sender.id works
  // even if one of them arrived as a string like "5"
  const userId: number | null =
    accountId != null ? Number(accountId) : savedUserId != null ? Number(savedUserId) : null;

  const currentChatId = useSelector(
    (state: RootState) => state.reduser.currentChatId
  );

  const dispatch = useDispatch<AppDispatch>();

  // writes errors and successes to the console (bottom of the chat list)
  const notify = useNotify();

  const [messageText, setMessageText] = useState("");

  const [messagesLoading, setMessagesLoading] = useState(true);

  const [isSending, setIsSending] = useState(false);

  /** the message whose options menu is open, and where to show the menu */
  const [menu, setMenu] = useState<{ message: ChatMessage; x: number; y: number } | null>(null);

  /** the message you're answering (null = not a reply) */
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  /** the original message that just got scrolled to, it flashes for a moment */
  const [flashMessageId, setFlashMessageId] = useState<number | null>(null);

  /** the message you're changing right now (null = writing a new one) */
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);

  /** what was in the box before you started editing, given back on cancel */
  const draftBeforeEditRef = useRef("");

  const longPressRef = useRef<{
    timer: ReturnType<typeof setTimeout>;
    x: number;
    y: number;
  } | null>(null);

  /** a long press just opened the menu → ignore the "contextmenu" that some phones also send */
  const openedByTouchAtRef = useRef(0);

  /** who is typing right now (null = nobody) */
  const [typingUser, setTypingUser] = useState<{ id: number; name: string } | null>(null);

  const otherUserTyping = typingUser !== null;

  const chatBottomRef = useRef<HTMLDivElement>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isTypingRef = useRef(false);

  const typingRepeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // name of the person you're talking to, used when the server sends no nickname
  const chatTitle = chats.find((c) => c.id === currentChatId)?.title ?? "";

  // also stop "typing…" by itself, in case the "stopped typing" signal is lost
  const typingSafetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------- load messages

  useEffect(() => {
    if (!currentChatId || !userId) {
      return;
    }

    let cancelled = false;

    const loadMessages = async () => {
      setMessagesLoading(true);

      try {
        // messages and "who has read how far" at the same time
        const [response, readsResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_SERVER_URL}/messages/getMessages/${currentChatId}`),
          fetch(`${import.meta.env.VITE_SERVER_URL}/messages/reads/${currentChatId}`),
        ]);

        if (!response.ok) {
          throw new Error("Failed to load messages");
        }

        const data: ChatMessage[] = await response.json();

        const reads: Record<string, number> = readsResponse.ok
          ? await readsResponse.json().catch(() => ({}))
          : {};

        if (!cancelled) {
          dispatch(onSetChat(data));
          dispatch(onSetChatReads(reads));
        }
      } catch (error) {
        console.error("Error loading messages:", error);
      } finally {
        if (!cancelled) {
          setMessagesLoading(false);
        }
      }
    };

    loadMessages();

    // switching chats quickly: ignore the answer for the old chat
    return () => {
      cancelled = true;
    };
  }, [currentChatId, userId, dispatch]);

  // ---------------------------------------------------------------- live messages

  useEffect(() => {
    if (!currentChatId) {
      return;
    }

    const subscription = subscribeToChat(
      currentChatId,
      (message: ChatMessage) => {
        dispatch(onAddMessage(message));

        // their message arrived → they're no longer typing
        if (Number(message.sender.id) !== userId) {
          setTypingUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [currentChatId, userId, dispatch]);

  // ---------------------------------------------------------------- edited / deleted messages

  useEffect(() => {
    if (!currentChatId) {
      return;
    }

    const subscription = subscribeToMessageUpdates(currentChatId, (update) => {
      if (update.type === "clear") {
        // someone cleared the history: no messages left, nothing to edit or answer
        dispatch(onSetChat([]));
        dispatch(onSetChatReads({}));
        setEditingMessage(null);
        setReplyingTo(null);
      } else if (update.type === "edit") {
        dispatch(onUpdateMessage(update.message));
      } else if (update.type === "delete") {
        dispatch(onDeleteMessage(Number(update.messageId)));

        // the message you were editing or replying to is gone
        setEditingMessage((editing) =>
          editing && editing.id === Number(update.messageId) ? null : editing
        );

        setReplyingTo((replying) =>
          replying && replying.id === Number(update.messageId) ? null : replying
        );
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [currentChatId, dispatch]);

  // ---------------------------------------------------------------- read receipts (check marks)

  // someone read further → update the check marks live
  useEffect(() => {
    if (!currentChatId) {
      return;
    }

    const subscription = subscribeToReads(currentChatId, (event) => {
      dispatch(onSetChatReads(event.reads));
    });

    return () => {
      subscription.unsubscribe();
      dispatch(onSetChatReads({}));
    };
  }, [currentChatId, dispatch]);

  /** every message of the chat by its id, to show what a reply answers */
  const messagesById = useMemo(() => {
    const map = new Map<number, ChatMessage>();
    chat.forEach((message) => map.set(message.id, message));
    return map;
  }, [chat]);

  /** newest message id we've already told the server about */
  const lastSentReadRef = useRef(0);

  const lastMessageId = chat.length > 0 ? chat[chat.length - 1].id : 0;

  // you've "seen" the messages when the chat is open and the tab is in front of you
  useEffect(() => {
    if (!currentChatId || !userId || messagesLoading || !lastMessageId) {
      return;
    }

    const markRead = () => {
      if (document.visibilityState !== "visible") {
        return; // the tab is in the background, you haven't seen them yet
      }

      if (lastMessageId <= lastSentReadRef.current) {
        return;
      }

      lastSentReadRef.current = lastMessageId;
      sendRead(currentChatId, userId, lastMessageId);
    };

    markRead();

    // coming back to the tab or window → mark what arrived meanwhile
    document.addEventListener("visibilitychange", markRead);
    window.addEventListener("focus", markRead);

    return () => {
      document.removeEventListener("visibilitychange", markRead);
      window.removeEventListener("focus", markRead);
    };
  }, [currentChatId, userId, messagesLoading, lastMessageId]);

  /**
   * Seen by everyone = every member except the sender has read this message
   * (or something newer). Needs at least one other member to count.
   */
  const isSeenByAll = (message: ChatMessage): boolean => {
    const others = Object.entries(chatReads).filter(
      ([memberId]) => Number(memberId) !== Number(message.sender.id)
    );

    return others.length > 0 && others.every(([, lastRead]) => Number(lastRead) >= message.id);
  };

  // ---------------------------------------------------------------- typing indicator

  useEffect(() => {
    if (!currentChatId || !userId) {
      return;
    }

    const subscription = subscribeToTyping(currentChatId, (event) => {
      const typerId = Number(event.userId);

      // your own typing is never shown to you
      if (typerId === userId) {
        return;
      }

      if (typingSafetyRef.current) {
        clearTimeout(typingSafetyRef.current);
        typingSafetyRef.current = null;
      }

      if (!event.typing) {
        setTypingUser(null);
        return;
      }

      setTypingUser({ id: typerId, name: event.nickname || chatTitle });

      typingSafetyRef.current = setTimeout(() => setTypingUser(null), 6000);
    });

    return () => {
      subscription.unsubscribe();

      if (typingSafetyRef.current) {
        clearTimeout(typingSafetyRef.current);
        typingSafetyRef.current = null;
      }

      setTypingUser(null);
    };
  }, [currentChatId, userId, chatTitle]);

  // you count as "typing" the whole time the message box is open (focused),
  // even before you write anything
  const stopTyping = () => {
    if (typingRepeatRef.current) {
      clearInterval(typingRepeatRef.current);
      typingRepeatRef.current = null;
    }

    if (!isTypingRef.current || !currentChatId || !userId) {
      return;
    }

    isTypingRef.current = false;
    sendTyping(currentChatId, userId, false);
  };

  const startTyping = () => {
    if (!currentChatId || !userId || isTypingRef.current) {
      return;
    }

    isTypingRef.current = true;
    sendTyping(currentChatId, userId, true);

    // keep reminding the other person while the box stays open
    typingRepeatRef.current = setInterval(() => {
      sendTyping(currentChatId, userId, true);
    }, TYPING_REPEAT_MS);
  };

  // leaving the chat → tell the other person you stopped typing
  useEffect(() => {
    return () => {
      if (typingRepeatRef.current) {
        clearInterval(typingRepeatRef.current);
        typingRepeatRef.current = null;
      }

      if (isTypingRef.current && currentChatId && userId) {
        sendTyping(currentChatId, userId, false);
        isTypingRef.current = false;
      }
    };
  }, [currentChatId, userId]);

  // ---------------------------------------------------------------- layout

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";

    // +2px: browsers round the height, and 1px too little would already
    // make a scrollbar appear in an empty box
    const contentHeight = textarea.scrollHeight + 2;

    // the limit from chat.css (smaller on phones), or MAX_INPUT_HEIGHT
    const maxHeight =
      parseFloat(getComputedStyle(textarea).maxHeight) || MAX_INPUT_HEIGHT;

    textarea.style.height = `${Math.min(contentHeight, maxHeight)}px`;

    // scrollbar only when the text doesn't fit any more
    textarea.style.overflowY = contentHeight > maxHeight ? "auto" : "hidden";
  }, [messageText]);

  // jump to the newest message when a chat opens, scroll smoothly after that
  useEffect(() => {
    if (!messagesLoading) {
      chatBottomRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messagesLoading]);

  // only when a message is added (not when one is edited or deleted)
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.length, otherUserTyping]);

  // ---------------------------------------------------------------- actions

  /**
   * Sends what's in the message box, or `quickText` if given
   * (the 👋 button in an empty chat) without touching the box.
   */
  const sendMessage = async (quickText?: string) => {
    const fromBox = quickText === undefined;
    const text = (fromBox ? messageText : quickText).trim();

    if (!text || isSending || !currentChatId || !userId) {
      return;
    }

    if (editingMessage && fromBox) {
      await saveEdit(editingMessage, text);
      return;
    }

    setIsSending(true);

    if (fromBox) {
      setMessageText(""); // clear right away so it feels instant
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/messages/addMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: userId,
            currentChatId: currentChatId,
            messageText: text,
            // the message you're answering (the 👋 button never replies)
            replyToId: fromBox ? replyingTo?.id ?? null : null,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (fromBox) {
          setMessageText(text); // give the text back so nothing is lost
        }
        notify("error", data.message || "Couldn't send the message");
        return;
      }

      // shown even if the WebSocket is down; duplicates are ignored by the reducer
      dispatch(onAddMessage(data));

      if (fromBox) {
        setReplyingTo(null);
      }
    } catch (err) {
      console.error(err);

      if (fromBox) {
        setMessageText(text);
      }

      notify("error", "Server error");
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
      return;
    }

    if (e.key === "Escape" && editingMessage) {
      e.preventDefault();
      cancelEdit();
      return;
    }

    if (e.key === "Escape" && replyingTo) {
      e.preventDefault();
      setReplyingTo(null);
    }
  };

  // ---------------------------------------------------------------- message menu

  const closeMenu = useCallback(() => setMenu(null), []);

  const openMenu = (message: ChatMessage, x: number, y: number) => {
    setMenu({ message, x, y });
  };

  // computers: right click
  const handleContextMenu = (e: React.MouseEvent, message: ChatMessage) => {
    e.preventDefault();

    // some phones send this too after a long press that already opened the menu
    if (Date.now() - openedByTouchAtRef.current < 800) {
      return;
    }

    openMenu(message, e.clientX, e.clientY);
  };

  // phones: hold a message
  const cancelLongPress = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current.timer);
      longPressRef.current = null;
    }
  };

  const handleTouchStart = (e: React.TouchEvent, message: ChatMessage) => {
    if (e.touches.length !== 1) {
      return;
    }

    const { clientX, clientY } = e.touches[0];

    cancelLongPress();

    longPressRef.current = {
      x: clientX,
      y: clientY,
      timer: setTimeout(() => {
        longPressRef.current = null;
        openedByTouchAtRef.current = Date.now();
        navigator.vibrate?.(12); // tiny buzz, like Telegram (Android only)
        openMenu(message, clientX, clientY + 12); // just below the finger
      }, LONG_PRESS_MS),
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const press = longPressRef.current;

    if (!press) {
      return;
    }

    const { clientX, clientY } = e.touches[0];

    if (Math.hypot(clientX - press.x, clientY - press.y) > LONG_PRESS_MOVE_PX) {
      cancelLongPress(); // it's a scroll, not a hold
    }
  };

  useEffect(() => cancelLongPress, []);

  // ---------------------------------------------------------------- menu actions

  const copyMessage = async (message: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(message.text);
    } catch {
      // older browsers / http pages: the old way
      const helper = document.createElement("textarea");
      helper.value = message.text;
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
    }

    notify("success", texts.copiedText);
  };

  const focusInput = () => {
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;

      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }
    });
  };

  // "Reply": a bar above the message box shows what you're answering
  const startReply = (message: ChatMessage) => {
    if (editingMessage) {
      cancelEdit(); // you can't edit and reply at the same time
    }

    setReplyingTo(message);
    focusInput();
  };

  // click the reply preview in a bubble → jump to the original and flash it
  const scrollToMessage = (messageId: number) => {
    const element = document.getElementById(`message-${messageId}`);

    if (!element) {
      return;
    }

    element.scrollIntoView({ behavior: "smooth", block: "center" });

    setFlashMessageId(null);
    requestAnimationFrame(() => setFlashMessageId(messageId));
  };

  // the flash fades by itself
  useEffect(() => {
    if (flashMessageId === null) {
      return;
    }

    const timer = setTimeout(() => setFlashMessageId(null), 1400);

    return () => clearTimeout(timer);
  }, [flashMessageId]);

  const startEdit = (message: ChatMessage) => {
    setReplyingTo(null); // you can't edit and reply at the same time

    if (!editingMessage) {
      draftBeforeEditRef.current = messageText;
    }

    setEditingMessage(message);
    setMessageText(message.text);

    requestAnimationFrame(() => {
      const textarea = textareaRef.current;

      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }
    });
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setMessageText(draftBeforeEditRef.current);
    draftBeforeEditRef.current = "";
  };

  const saveEdit = async (message: ChatMessage, text: string) => {
    if (!userId) {
      return;
    }

    // nothing changed → just leave edit mode
    if (text === message.text) {
      cancelEdit();
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/messages/editMessage`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId: message.id, userId, text }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        notify("error", data.message || "Couldn't edit the message");
        return;
      }

      dispatch(onUpdateMessage(data));
      setEditingMessage(null);
      setMessageText(draftBeforeEditRef.current);
      draftBeforeEditRef.current = "";
    } catch (err) {
      console.error(err);
      notify("error", "Server error");
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const deleteMessage = async (message: ChatMessage) => {
    if (!userId) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/messages/deleteMessage/${message.id}?userId=${userId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        notify("error", data.message || "Couldn't delete the message");
        return;
      }

      dispatch(onDeleteMessage(message.id));

      if (editingMessage?.id === message.id) {
        cancelEdit();
      }
    } catch (err) {
      console.error(err);
      notify("error", "Server error");
    }
  };

  const closeChat = () => {
    stopTyping();
    dispatch(onSetCurrentChat(null));
  };

  // ---------------------------------------------------------------- render

  const showChat = () => {
    if (!chat || chat.length === 0) {
      // a friendly card in the middle of the chat, like Telegram's
      // "No messages here yet" – tap the hand to send a 👋
      return (
        <div className="gretting">
          <div className="emptyChatCard">
            <button
              className="emptyChatWave"
              type="button"
              onClick={() => sendMessage("👋")}
              disabled={isSending}
              aria-label="Send 👋"
              title="Send 👋"
            >
              <span aria-hidden="true">👋</span>
            </button>

            <div className="emptyChatText">{texts.emptyChatText}</div>
            <div className="emptyChatHint">{texts.emptyChatHintText}</div>
          </div>
        </div>
      );
    }

    return chat.map((msg, i) => {
      const previous = chat[i - 1]; // undefined for the first message

      const isOwn = userId !== null && Number(msg.sender.id) === userId;

      // same person as the message before → stick to it, no avatar
      // (the avatar is only on the first message of the group)
      const continuesGroup = sameGroup(previous, msg);

      const className = [
        "message",
        continuesGroup ? "messageFollow" : "",
        menu?.message.id === msg.id ? "messageSelected" : "",
        flashMessageId === msg.id ? "messageFlash" : "",
        editingMessage?.id === msg.id ? "messageEditing" : "",
      ]
        .filter(Boolean)
        .join(" ");

      return (
        <div
          className={className}
          key={msg.id}
          id={`message-${msg.id}`}
          onContextMenu={(e) => handleContextMenu(e, msg)}
          onTouchStart={(e) => handleTouchStart(e, msg)}
          onTouchMove={handleTouchMove}
          onTouchEnd={cancelLongPress}
          onTouchCancel={cancelLongPress}
        >
          {continuesGroup ? (
            // empty space as wide as an avatar, so the bubbles line up
            <div className="messageAvatarSpacer" aria-hidden="true" />
          ) : (
            <img
              className="messageAvatar"
              src={avatarUrl(msg.sender.avatar)}
              alt=""
              onError={handleAvatarError}
            />
          )}

          <div className="messageContent">
            {/* what this message answers; click → jump to it */}
            {msg.replyToId != null && (
              <ReplyPreview
                original={messagesById.get(msg.replyToId)}
                deletedText={texts.deletedMessageText}
                onClick={() => msg.replyToId != null && scrollToMessage(msg.replyToId)}
              />
            )}

            <div className="messageHeader">
              <span className="messageSender">{msg.sender.nickname}</span>
              <span className="messageTime">
                {msg.edited && <span className="messageEdited">{texts.editedText}</span>}
                {formatTime(msg.sendTime)}
                {isOwn && <MessageEye seen={isSeenByAll(msg)} />}
              </span>
            </div>

            <div className="messageText">{msg.text}</div>
          </div>
        </div>
      );
    });
  };

  if (messagesLoading) {
    return <MiniLoading />;
  }

  return (
    <div className="placeForChat">
      <div className="chatWithUser">
        {showChat()}

        <div ref={chatBottomRef} />

        {/* "Alexey is typing…" like in Telegram, stuck to the bottom of the chat */}
        {typingUser && (
          <div className="typingStatus" aria-live="polite">
            <span className="typingDots" aria-hidden="true">
              <span className="typingDot"></span>
              <span className="typingDot"></span>
              <span className="typingDot"></span>
            </span>

            <span className="typingName">{typingUser.name}</span>
            <span className="typingText">{texts.typingText}</span>
          </div>
        )}
      </div>

      {/* "Reply to Alexey" bar above the message box */}
      {replyingTo && !editingMessage && (
        <div className="editingBar replyBar">
          <span className="editingBarIcon" aria-hidden="true">
            <ReplyIcon />
          </span>

          <div className="editingBarText">
            <span className="editingBarTitle">
              {texts.replyToText} {replyingTo.sender.nickname}
            </span>
            <span className="editingBarPreview">{replyingTo.text}</span>
          </div>

          <button
            className="editingBarClose"
            type="button"
            aria-label="Cancel reply"
            onClick={() => setReplyingTo(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* "Editing" bar above the message box */}
      {editingMessage && (
        <div className="editingBar">
          <span className="editingBarIcon" aria-hidden="true">✎</span>

          <div className="editingBarText">
            <span className="editingBarTitle">{texts.editingText}</span>
            <span className="editingBarPreview">{editingMessage.text}</span>
          </div>

          <button
            className="editingBarClose"
            type="button"
            aria-label="Cancel editing"
            onClick={cancelEdit}
          >
            ×
          </button>
        </div>
      )}

      <div className="writeMessagePlace">
        <div className="closeChatBtnPlace">
          <button
            className="closeChatBtn"
            type="button"
            aria-label="Close chat"
            onClick={closeChat}
          >
            {/* × on computers, ← on phones (see chat.css) */}
            <span className="closeIcon">×</span>
            <span className="backIcon">←</span>
          </button>
        </div>

        <div className="messageInputWrapper">
          <textarea
            ref={textareaRef}
            className="writeMessageInput"
            placeholder={texts.inputText}
            value={messageText}
            rows={1}
            onFocus={startTyping}
            onBlur={stopTyping}
            onKeyDown={handleKeyDown}
            onChange={(e) => {
              setMessageText(e.target.value);
              startTyping();
            }}
          />

          <button
            className="sendMessageBtn"
            type="button"
            aria-label={editingMessage ? "Save" : "Send"}
            onClick={() => sendMessage()}
            disabled={isSending || !messageText.trim()}
          >
            {/* ✓ while editing, ➤ for a new message */}
            {editingMessage ? "✓" : "➤"}
          </button>
        </div>

        {/* empty for now (a button can go here later) */}
        <div className="chatSidePlace" />
      </div>

      {menu && (
        <MessageMenu
          x={menu.x}
          y={menu.y}
          message={menu.message}
          isOwn={userId !== null && Number(menu.message.sender.id) === userId}
          onClose={closeMenu}
          onCopy={copyMessage}
          onReply={startReply}
          onEdit={startEdit}
          onDelete={deleteMessage}
        />
      )}
    </div>
  );
};

const Chat: React.FC = () => {
  const currentChatId = useSelector(
    (state: RootState) => state.reduser.currentChatId
  );

  return (
    <div className="main">
      {!currentChatId ? <ChatGretting /> : <ChatWithUser key={currentChatId} />}
    </div>
  );
};

export default Chat;