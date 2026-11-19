import React, { useCallback, useEffect, useRef, useState } from "react";
import "./sideBar.css";

import { RootState, AppDispatch } from "../store/store";

import { useSelector, useDispatch } from "react-redux";

import {
  Chat,
  onSetChats,
  onSetCurrentChat,
  onSetChatsLoading,
} from "../reduser/reduser";

import { NavLink } from "react-router-dom";

import MiniLoading from "../animations/miniLoading/MiniLoading";

import ChatMenu from "../menus/ChatMenu";

import { useUnreadCounts } from "../hooks/useUnreadCounts";

import { avatarUrl, handleAvatarError } from "../avatarEditor/avatarUrl";

/** hold a chat this long on a phone to open its menu */
const LONG_PRESS_MS = 450;

/** moving the finger further than this cancels the long press (it's a scroll) */
const LONG_PRESS_MOVE_PX = 10;

interface ChatsSideBarProps {}

const SideBar: React.FC<ChatsSideBarProps> = (): React.JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();

  const texts = useSelector((state: RootState) => state.reduser.texts);

  const userId = useSelector((state: RootState) => state.reduser.userId);

  const chats = useSelector((state: RootState) => state.reduser.chats);

  const currentChatId = useSelector(
    (state: RootState) => state.reduser.currentChatId
  );

  const chatsLoading = useSelector(
    (state: RootState) => state.reduser.chatsLoading
  );

  /** unread messages per chat (kept up to date live) */
  const notifications = useSelector(
    (state: RootState) => state.reduser.notifications
  );

  useUnreadCounts();

  /** the chat whose menu is open, and where to show the menu */
  const [menu, setMenu] = useState<{ chat: Chat; x: number; y: number } | null>(null);

  const longPressRef = useRef<{
    timer: ReturnType<typeof setTimeout>;
    x: number;
    y: number;
  } | null>(null);

  /** a long press just opened the menu → ignore the "contextmenu" some phones also send */
  const openedByTouchAtRef = useRef(0);

  /** the long press opened the menu → the finger lifting must not also open the chat */
  const skipNextClickRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      dispatch(onSetChats([]));
      dispatch(onSetChatsLoading(false));
      return;
    }

    let cancelled = false;

    const loadChats = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SERVER_URL}/chats/getChats/${userId}`
        );

        if (!response.ok) {
          throw new Error("Couldn't load chats");
        }

        const data = await response.json();

        if (!cancelled) {
          dispatch(onSetChats(data));
        }
      } catch (error) {
        console.error("Failed to load chats:", error);
      } finally {
        if (!cancelled) {
          dispatch(onSetChatsLoading(false));
        }
      }
    };

    loadChats();

    // ignore the answer if the user logged out/in again before it arrived
    return () => {
      cancelled = true;
    };
  }, [userId, dispatch]);

  const openChat = (chatId: number) => {
    if (!userId) {
      return;
    }

    dispatch(onSetCurrentChat(chatId));
  };

  // ---------------------------------------------------------------- chat menu

  const closeMenu = useCallback(() => setMenu(null), []);

  // computers: right click
  const handleContextMenu = (e: React.MouseEvent, chat: Chat) => {
    e.preventDefault();

    // some phones send this too after a long press that already opened the menu
    if (Date.now() - openedByTouchAtRef.current < 800) {
      return;
    }

    setMenu({ chat, x: e.clientX, y: e.clientY });
  };

  // phones: hold a chat
  const cancelLongPress = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current.timer);
      longPressRef.current = null;
    }
  };

  const handleTouchStart = (e: React.TouchEvent, chat: Chat) => {
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
        skipNextClickRef.current = true;
        navigator.vibrate?.(12); // tiny buzz (Android only)
        setMenu({ chat, x: clientX, y: clientY + 12 }); // just below the finger
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

  const handleClick = (chatId: number) => {
    if (skipNextClickRef.current) {
      skipNextClickRef.current = false;
      return;
    }

    openChat(chatId);
  };

  // ---------------------------------------------------------------- render

  const returnChats = () => {
    if (chats.length === 0) {
      return <div className="noChatsMessage">{texts.zeroChatsText}</div>;
    }

    return chats.map((chat) => {
      // the open chat is being read right now, so no number on it
      const unread = chat.id === currentChatId ? 0 : notifications[chat.id]?.count ?? 0;

      return (
      <div
        className={[
          "singleChat",
          chat.id === currentChatId ? "active" : "",
          menu?.chat.id === chat.id ? "menuOpen" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        key={chat.id}
        title={chat.title}
        role="button"
        tabIndex={0}
        onClick={() => handleClick(chat.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter") openChat(chat.id);
        }}
        onContextMenu={(e) => handleContextMenu(e, chat)}
        onTouchStart={(e) => handleTouchStart(e, chat)}
        onTouchMove={handleTouchMove}
        onTouchEnd={cancelLongPress}
        onTouchCancel={cancelLongPress}
      >
        <img
          className="chatAvatar"
          src={avatarUrl(chat.avatar)}
          alt=""
          draggable={false}
          onError={handleAvatarError}
        />
        <div className="singleChatTitle">{chat.title}</div>

        {/* purple circle with the number of unread messages */}
        {unread > 0 && (
          <span className="unreadBadge" key={unread} aria-label={`${unread} unread`}>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </div>
      );
    });
  };

  return (
    <div className="sideBar">
      {chatsLoading ? (
        <div className="sideBarLoading">
          <MiniLoading />
        </div>
      ) : (
        <>
          <div className="sideBarHeader">
            <div className="chatsSettings">
              <div className="chatsTitle">{texts.chatsText}</div>
              <div className="addBtnPlace">
                {userId ? (
                  <NavLink
                    to="/addChat"
                    className="addBtn"
                    aria-label="New chat"
                  >
                    +
                  </NavLink>
                ) : (
                  <button
                    className="addBtn"
                    aria-label="New chat"
                    onClick={() => {
                    }}
                  >
                    +
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="chats">{returnChats()}</div>
        </>
      )}

      {/* right click / hold on a chat */}
      {menu && (
        <ChatMenu x={menu.x} y={menu.y} chat={menu.chat} onClose={closeMenu} />
      )}
    </div>
  );
};

export default SideBar;