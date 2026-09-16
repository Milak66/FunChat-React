import React, { useEffect, useRef, useState } from "react";
import "./chat.css";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import chatImage from "../../assets/chatImage.jpg";
import { useEmojiModal } from "../hooks/useEmojiHook";
import {
  onAddMessage,
  ChatMessage,
  onSetChat,
  onSetCurrentChat,
  onRemoveChat
} from "../reduser/reduser";
import deleteIcon from "../../assets/deleteIcon.jpg";
import { subscribeToChat } from "../socket/socket";

const ChatGretting: React.FC = () => {
  const texts = useSelector((state: RootState) => state.reduser.texts);

  return (
    <div className="gretting">
      <div className="createChatMessage">{texts.createChatText}</div>

      <img className="chatImage" draggable="false" src={chatImage} alt="" />
    </div>
  );
};

const ChatWithUser: React.FC = () => {
  const texts = useSelector((state: RootState) => state.reduser.texts);

  const chat = useSelector((state: RootState) => state.reduser.chat);

  const [messageText, setMessageText] = useState("");

  const userId = useSelector((state: RootState) => state.reduser.user.id);

  const currentChatId = useSelector(
    (state: RootState) => state.reduser.currentChatId
  );

  const dispatch = useDispatch<AppDispatch>();

  const { showEmoji } = useEmojiModal();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!currentChatId || !userId) {
      return;
    }

    const loadMessages = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SERVER_URL}/messages/getMessages/${currentChatId}`
        );

        if (!response.ok) {
          throw new Error("Failed to load messages");
        }

        const data: ChatMessage[] = await response.json();

        dispatch(onSetChat(data));
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    };

    loadMessages();
  }, [currentChatId, userId, dispatch]);

  useEffect(() => {
    if (!currentChatId) {
      return;
    }

    const subscription = subscribeToChat(
      currentChatId,
      (message: ChatMessage) => {
        dispatch(onAddMessage(message));
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [currentChatId, dispatch]);

  const resizeTextarea = () => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";

    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      window.innerWidth <= 768
        ? window.innerHeight * 0.12
        : window.innerHeight * 0.18
    )}px`;
  };

  useEffect(() => {
    resizeTextarea();
  }, [messageText]);

  const showChat = () => {
    if (!chat || chat.length === 0) {
      return (
        <div className="gretting">
          <div className="emptyChatText">{texts.emptyChatText}</div>
        </div>
      );
    }

    return chat.map((msg) => {
      return (
        <div
          className={userId == msg.sender.id ? "myMessage" : "userMessage"}
          key={msg.id}
        >
          <span className={userId == msg.sender.id ? "myText" : "userText"}>
            {msg.text}
          </span>
        </div>
      );
    });
  };

  const sendMessage = async () => {
    if (!messageText.trim()) {
      showEmoji(":(", "red", "Enter a text");
      return;
    }

    if (!currentChatId || !userId) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/messages/addMessage`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            sender: userId,
            currentChatId: currentChatId,
            messageText: messageText,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showEmoji(":(", "red", data.message || "Error sending message");

        return;
      }

      setMessageText("");
    } catch (err) {
      console.error(err);

      showEmoji(":(", "red", "Server error");
    }
  };

  const addMessage = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      sendMessage();
    }
  };

  const deleteChat = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/chats/deleteChat/${currentChatId}`,
        {
          method: "DElETE",
          headers: { "Content-Type": "application/json" }
        }
      );

      if (!response.ok) {
        showEmoji(":(", "red", "Error deleting chat");
        return;
      }

      dispatch(onRemoveChat(currentChatId!));
      dispatch(onSetCurrentChat(null));
    } catch (err) {
      console.error(err);
      showEmoji(":(", "red", "Server error");
    }
  }

  return (
    <div className="placeForChat">
      <div className="chatWithUser">{showChat()}</div>

      <div className="writeMessagePlace">
        <div className="closeChatBtnPlace">
          <button
            className="closeChatBtn"
            type="button"
            aria-label="Close chat"
            onClick={() => {
              dispatch(onSetCurrentChat(null));
            }}
          >
            ×
          </button>
        </div>

        <div className="messageInputWrapper">
          <textarea
            ref={textareaRef}
            className="writeMessageInput"
            placeholder={texts.inputText}
            value={messageText}
            rows={1}
            onKeyDown={addMessage}
            onChange={(e) => {
              setMessageText(e.target.value);
            }}
          />

          <button
            className="sendMessageBtn"
            type="button"
            onClick={sendMessage}
          >
            ➤
          </button>
        </div>

        <div className="deleteChatPlace">
          <img className="deleteChatImg" onClick={deleteChat} src={deleteIcon} alt="" />
        </div>
      </div>
    </div>
  );
};

const Chat: React.FC = () => {
  const currentChatId = useSelector(
    (state: RootState) => state.reduser.currentChatId
  );

  return (
    <div className="main">
      {!currentChatId ? <ChatGretting /> : <ChatWithUser />}
    </div>
  );
};

export default Chat;
