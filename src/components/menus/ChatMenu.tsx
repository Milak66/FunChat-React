import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import "./chatMenu.css";

import { RootState, AppDispatch } from "../store/store";
import {
  Chat,
  onRemoveChat,
  onSetChat,
  onSetCurrentChat,
} from "../reduser/reduser";
import { TrashIcon } from "../images/messageMenuIcons";
import { useNotify } from "../hooks/useNotify";

interface ChatMenuProps {
  /** where the right click / long press happened (px, on screen) */
  x: number;
  y: number;
  /** the chat in the chat list it was opened for */
  chat: Chat;
  onClose: () => void;
}

/** keep the menu this far from the edges of the screen */
const EDGE = 10;

/** taps this soon after opening are ignored (lifting the finger after a long press) */
const IGNORE_TAPS_MS = 350;

/**
 * Menu for a chat in the chat list (right click, or hold on a phone).
 * For now it has one option: Delete chat (asks "Tap again" first).
 */
const ChatMenu: React.FC<ChatMenuProps> = ({ x, y, chat, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const notify = useNotify();

  const texts = useSelector((state: RootState) => state.reduser.texts);
  const currentChatId = useSelector(
    (state: RootState) => state.reduser.currentChatId
  );

  const menuRef = useRef<HTMLDivElement>(null);
  const openedAtRef = useRef(Date.now());

  const [position, setPosition] = useState({
    left: x,
    top: y,
    origin: "top left",
  });
  const [placed, setPlaced] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // next to the pointer, flipped left/up so it never leaves the screen
  useLayoutEffect(() => {
    const menu = menuRef.current;

    if (!menu) {
      return;
    }

    const { width, height } = menu.getBoundingClientRect();

    const opensLeft = x + width > window.innerWidth - EDGE;
    const opensUp = y + height > window.innerHeight - EDGE;

    setPosition({
      left: Math.min(
        Math.max(EDGE, opensLeft ? x - width : x),
        window.innerWidth - width - EDGE
      ),
      top: Math.min(
        Math.max(EDGE, opensUp ? y - height : y),
        window.innerHeight - height - EDGE
      ),
      origin: `${opensUp ? "bottom" : "top"} ${opensLeft ? "right" : "left"}`,
    });

    setPlaced(true);
  }, [x, y]);

  // Esc closes; scrolling the list or resizing closes
  useEffect(() => {
    menuRef.current
      ?.querySelector<HTMLButtonElement>(".chatMenuItem")
      ?.focus({ preventScroll: true });

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKey);
    window.addEventListener("resize", onClose);
    window.addEventListener("scroll", onClose, true);

    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [onClose]);

  const deleteChat = async () => {
    if (Date.now() - openedAtRef.current < IGNORE_TAPS_MS) {
      return;
    }

    // first tap: "Tap again to delete"
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    onClose();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/chats/deleteChat/${chat.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        notify("error", "Couldn't delete the chat");
        return;
      }

      dispatch(onRemoveChat(chat.id));

      // it was the open chat → close it
      if (currentChatId === chat.id) {
        dispatch(onSetChat([]));
        dispatch(onSetCurrentChat(null));
      }

      notify("success", "The chat has been deleted");
    } catch (err) {
      console.error(err);
      notify("error", "Server error");
    }
  };

  return (
    <div
      className="chatMenuOverlay"
      onMouseDown={onClose}
      onTouchStart={onClose}
      onContextMenu={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div
        ref={menuRef}
        className={`chatMenu${placed ? " placed" : ""}`}
        role="menu"
        aria-label={texts.chatOptionsText}
        style={{
          left: position.left,
          top: position.top,
          transformOrigin: position.origin,
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="chatMenuHeader">
          <span>{chat.title}</span>
        </div>

        <div className="chatMenuItems">
          <button
            className={`chatMenuItem danger${confirmDelete ? " confirm" : ""}`}
            role="menuitem"
            style={{ "--i": 0 } as React.CSSProperties}
            onClick={deleteChat}
          >
            <span className="chatMenuIcon">
              <TrashIcon />
            </span>
            {confirmDelete ? texts.deleteChatConfirmText : texts.deleteChatText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatMenu;
