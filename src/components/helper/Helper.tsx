import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import "./helper.css";

import { RootState, AppDispatch } from "../store/store";
import {
  onSetConsoleOpen,
  onSetConsoleEnabled,
  onClearConsole,
} from "../reduser/reduser";
import { ConsoleIcon, ClearIcon, ChevronIcon, CloseIcon } from "../images/consoleIcons";

/** after a new line, the console shrinks back to one line after this long */
const AUTO_COLLAPSE_MS = 5000;

/** where a registered user's "console off" choice is remembered (per account) */
const storageKey = (userId: number) => `funchat.console.enabled.${userId}`;

function formatTime(time: string): string {
  const date = new Date(time);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * The FunChat console: errors, successes and notifications, docked at the
 * bottom of the chat list.
 *  - a new line opens it; 5 seconds later it shrinks to a one-line bar
 *    (not while your mouse is over it)
 *  - click the bar to see the whole history again
 *  - registered users can close it (×); guests always have it
 */
const Console: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const texts = useSelector((state: RootState) => state.reduser.texts);
  const messages = useSelector((state: RootState) => state.reduser.console);
  const isOpen = useSelector((state: RootState) => state.reduser.isConsoleOpen);
  const isEnabled = useSelector((state: RootState) => state.reduser.isConsoleEnabled);
  const userId = useSelector((state: RootState) => state.reduser.user.id);

  const isRegistered = userId != null;

  const listRef = useRef<HTMLDivElement>(null);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const lastMessage = messages[messages.length - 1];

  // ---------------------------------------------------------------- on / off per account

  // signing in → use the choice this account made last time (default: on)
  useEffect(() => {
    if (userId == null) {
      dispatch(onSetConsoleEnabled(true)); // guests always see the console
      return;
    }

    try {
      dispatch(onSetConsoleEnabled(localStorage.getItem(storageKey(userId)) !== "false"));
    } catch {
      dispatch(onSetConsoleEnabled(true));
    }
  }, [userId, dispatch]);

  const closeConsole = () => {
    if (userId == null) {
      return;
    }

    try {
      localStorage.setItem(storageKey(userId), "false");
    } catch {
      // private window: it just won't be remembered
    }

    dispatch(onSetConsoleEnabled(false));
  };

  // ---------------------------------------------------------------- open / shrink

  const clearCollapseTimer = () => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
  };

  // a new line arrived (the reducer already opened the console) → shrink later
  useEffect(() => {
    if (!lastMessage || !isOpen || isHovered) {
      return;
    }

    clearCollapseTimer();
    collapseTimerRef.current = setTimeout(() => {
      dispatch(onSetConsoleOpen(false));
    }, AUTO_COLLAPSE_MS);

    return clearCollapseTimer;
  }, [lastMessage?.id, isOpen, isHovered, dispatch]);

  // newest line always visible
  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [isOpen, messages.length]);

  const toggle = () => {
    clearCollapseTimer();
    dispatch(onSetConsoleOpen(!isOpen));
  };

  if (isRegistered && !isEnabled) {
    return null;
  }

  // ---------------------------------------------------------------- render

  return (
    <section
      className={`console${isOpen ? " open" : ""}`}
      aria-label={texts.consoleText}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* header: always visible; when shrunk it shows the newest line */}
      <div className="consoleBar">
        <button
          className="consoleBarMain"
          type="button"
          onClick={toggle}
          aria-expanded={isOpen}
        >
          <span className="consoleLogo">
            <ConsoleIcon />
          </span>

          {isOpen || !lastMessage ? (
            <span className="consoleTitle">
              {texts.consoleText}
              {messages.length > 0 && <span className="consoleCount">{messages.length}</span>}
            </span>
          ) : (
            // shrunk: the newest line, so you can read it without opening
            <span className={`consolePreview ${lastMessage.type}`} key={lastMessage.id}>
              <span className="consoleDot" />
              <span className="consolePreviewText">{lastMessage.text}</span>
            </span>
          )}

          <span className="consoleChevron">
            <ChevronIcon />
          </span>
        </button>

        {isOpen && messages.length > 0 && (
          <button
            className="consoleIconBtn"
            type="button"
            onClick={() => dispatch(onClearConsole())}
            aria-label="Clear console"
            title="Clear"
          >
            <ClearIcon />
          </button>
        )}

        {isRegistered && (
          <button
            className="consoleIconBtn"
            type="button"
            onClick={closeConsole}
            aria-label="Close console"
            title="Close console"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* the history */}
      <div className="consoleBody" aria-hidden={!isOpen}>
        <div className="consoleList" ref={listRef} role="log" aria-live="polite">
          {messages.length === 0 ? (
            <div className="consoleEmpty">{texts.consoleEmptyText}</div>
          ) : (
            messages.map((message) => (
              <div className={`consoleLine ${message.type}`} key={message.id}>
                <span className="consoleTime">{formatTime(message.time)}</span>
                <span className="consoleDot" />
                <span className="consoleText">{message.text}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default Console;