import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

import "./messageMenu.css";

import { RootState } from "../store/store";
import { ChatMessage } from "../reduser/reduser";
import {
  CopyIcon,
  ReplyIcon,
  EditIcon,
  TrashIcon,
  ClockIcon,
} from "../images/messageMenuIcons";

interface MessageMenuProps {
  /** where the right click / long press happened (px, viewport) */
  x: number;
  y: number;
  message: ChatMessage;
  /** your own message → Edit and Delete are shown */
  isOwn: boolean;
  onClose: () => void;
  onCopy: (message: ChatMessage) => void;
  onReply: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage) => void;
}

/** keep the menu this far from the edges of the screen */
const EDGE = 10;

/**
 * Taps this soon after the menu opened are ignored: on phones, lifting the
 * finger after a long press would otherwise "click" the option under it.
 */
const IGNORE_TAPS_MS = 350;

// ---------------------------------------------------------------- helpers

/** "Today at 16:38", "Yesterday at 09:12" or "12 Nov 2026 at 18:01" */
function formatFullTime(sendTime: string): string {
  const date = new Date(sendTime);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const time = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return `Today at ${time}`;
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${time}`;
  }

  const day = date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });

  return `${day} at ${time}`;
}

// ---------------------------------------------------------------- menu

const MessageMenu: React.FC<MessageMenuProps> = ({
  x,
  y,
  message,
  isOwn,
  onClose,
  onCopy,
  onReply,
  onEdit,
  onDelete,
}) => {
  const texts = useSelector((state: RootState) => state.reduser.texts);

  const menuRef = useRef<HTMLDivElement>(null);

  const openedAtRef = useRef(Date.now());

  const [position, setPosition] = useState({
    left: x,
    top: y,
    origin: "top left",
  });

  const [placed, setPlaced] = useState(false);

  // first click on Delete asks "Tap again to delete", second one deletes
  const [confirmDelete, setConfirmDelete] = useState(false);

  // open next to the pointer, but flip left/up so it never leaves the screen
  useLayoutEffect(() => {
    const menu = menuRef.current;

    if (!menu) {
      return;
    }

    const { width, height } = menu.getBoundingClientRect();

    const opensLeft = x + width > window.innerWidth - EDGE;
    const opensUp = y + height > window.innerHeight - EDGE;

    const left = Math.max(EDGE, opensLeft ? x - width : x);
    const top = Math.max(EDGE, opensUp ? y - height : y);

    setPosition({
      left: Math.min(left, window.innerWidth - width - EDGE),
      top: Math.min(top, window.innerHeight - height - EDGE),
      origin: `${opensUp ? "bottom" : "top"} ${opensLeft ? "right" : "left"}`,
    });

    setPlaced(true);
  }, [x, y]);

  // keyboard: Esc closes, arrows move between options; scrolling or resizing closes
  useEffect(() => {
    const items = (): HTMLButtonElement[] => {
      const menu = menuRef.current;

      return menu
        ? Array.from(
            menu.querySelectorAll<HTMLButtonElement>(".messageMenuItem")
          )
        : [];
    };

    items()[0]?.focus({ preventScroll: true });

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();

        const list = items();
        const current = list.indexOf(
          document.activeElement as HTMLButtonElement
        );
        const step = e.key === "ArrowDown" ? 1 : -1;
        const next = (current + step + list.length) % list.length;

        list[next]?.focus();
      }
    };

    const close = () => onClose();

    window.addEventListener("keydown", handleKey);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);

    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [onClose]);

  const tooSoon = () => Date.now() - openedAtRef.current < IGNORE_TAPS_MS;

  const choose = (action: (message: ChatMessage) => void) => {
    if (tooSoon()) {
      return;
    }

    action(message);
    onClose();
  };

  const handleDelete = () => {
    if (tooSoon()) {
      return;
    }

    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    choose(onDelete);
  };

  // the order of the options, so they can appear one after another
  let index = 0;
  const delay = () => ({ "--i": index++ } as React.CSSProperties);

  return (
    <div
      className="messageMenuOverlay"
      onMouseDown={onClose}
      onTouchStart={onClose}
      onContextMenu={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div
        ref={menuRef}
        className={`messageMenu${placed ? " placed" : ""}`}
        role="menu"
        aria-label="Message options"
        style={{
          left: position.left,
          top: position.top,
          transformOrigin: position.origin,
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="messageMenuHeader">
          <ClockIcon />
          <span>{formatFullTime(message.sendTime)}</span>

          {message.edited && (
            <span className="messageMenuChip">{texts.editedText}</span>
          )}
        </div>

        <div className="messageMenuItems">
          <button
            className="messageMenuItem"
            role="menuitem"
            style={delay()}
            onClick={() => choose(onReply)}
          >
            <span className="messageMenuIcon">
              <ReplyIcon />
            </span>
            {texts.replyText}
          </button>

          <button
            className="messageMenuItem"
            role="menuitem"
            style={delay()}
            onClick={() => choose(onCopy)}
          >
            <span className="messageMenuIcon">
              <CopyIcon />
            </span>
            {texts.copyText}
          </button>

          {isOwn && (
            <button
              className="messageMenuItem"
              role="menuitem"
              style={delay()}
              onClick={() => choose(onEdit)}
            >
              <span className="messageMenuIcon">
                <EditIcon />
              </span>
              {texts.editText}
            </button>
          )}

          {isOwn && (
            <>
              <div className="messageMenuDivider" style={delay()} />

              <button
                className={`messageMenuItem danger${
                  confirmDelete ? " confirm" : ""
                }`}
                role="menuitem"
                style={delay()}
                onClick={handleDelete}
              >
                <span className="messageMenuIcon">
                  <TrashIcon />
                </span>
                {confirmDelete ? texts.deleteConfirmText : texts.deleteText}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageMenu;
