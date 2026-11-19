import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import "./notifications.css";

import { RootState, AppDispatch } from "../store/store";
import {
  ChatNotification,
  onSetCurrentChat,
  onSetNotifications,
  onUpdateNotification,
} from "../reduser/reduser";
import { subscribeToNotifications } from "../socket/socket";
import BellIcon from "../images/BellIcon";
import { avatarUrl, handleAvatarError } from "../avatarEditor/avatarUrl";

/** "16:38" for today, "18 Nov" for older ones */
function formatTime(time: string | null): string {
  if (!time) {
    return "";
  }

  const date = new Date(time);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  if (date.toDateString() === new Date().toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return date.toLocaleDateString([], { day: "numeric", month: "short" });
}

/**
 * The bell in the header. It lists every chat that has unread messages,
 * one row per chat ("FunChat · 3"), never one row per message.
 * Click a row to open that chat.
 */
const Notifications: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const texts = useSelector((state: RootState) => state.reduser.texts);
  const userId = useSelector((state: RootState) => state.reduser.userId);
  const chats = useSelector((state: RootState) => state.reduser.chats);
  const currentChatId = useSelector((state: RootState) => state.reduser.currentChatId);
  const notifications = useSelector((state: RootState) => state.reduser.notifications);

  const [isOpen, setIsOpen] = useState(false);
  const [isRinging, setIsRinging] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------- load + live updates

  useEffect(() => {
    if (!userId) {
      dispatch(onSetNotifications([]));
      return;
    }

    let cancelled = false;

    // what was unread while you were away
    fetch(`${import.meta.env.VITE_SERVER_URL}/messages/unread/${userId}`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data: ChatNotification[]) => {
        if (!cancelled) {
          dispatch(onSetNotifications(data));
        }
      })
      .catch((error) => console.error("Couldn't load notifications:", error));

    // and from now on, live
    const subscription = subscribeToNotifications(userId, (notification) => {
      dispatch(onUpdateNotification(notification));
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [userId, dispatch]);

  // ---------------------------------------------------------------- what to show

  // the chat you have open is being read right now, so it isn't listed
  const list = useMemo(
    () =>
      Object.values(notifications)
        .filter((n) => n.chatId !== currentChatId)
        .sort((a, b) => String(b.lastTime).localeCompare(String(a.lastTime))),
    [notifications, currentChatId]
  );

  const total = list.reduce((sum, n) => sum + n.count, 0);

  // the bell rings when the number goes up
  const previousTotalRef = useRef(total);

  useEffect(() => {
    if (total > previousTotalRef.current) {
      setIsRinging(true);
      const timer = setTimeout(() => setIsRinging(false), 900);
      previousTotalRef.current = total;
      return () => clearTimeout(timer);
    }

    previousTotalRef.current = total;
  }, [total]);

  // ---------------------------------------------------------------- open / close

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOutside = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const closeOnEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("touchstart", closeOutside);
    window.addEventListener("keydown", closeOnEsc);

    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("touchstart", closeOutside);
      window.removeEventListener("keydown", closeOnEsc);
    };
  }, [isOpen]);

  const openChat = (chatId: number) => {
    dispatch(onSetCurrentChat(chatId));
    setIsOpen(false);
  };

  // ---------------------------------------------------------------- render

  return (
    <div className="notifications" ref={wrapperRef}>
      <button
        className={`notificationsButton${isRinging ? " ringing" : ""}${isOpen ? " open" : ""}`}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={total > 0 ? `${texts.notificationsText}: ${total}` : texts.notificationsText}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title={texts.notificationsText}
      >
        <BellIcon />

        {total > 0 && (
          <span className="notificationsBadge" key={total}>
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notificationsPanel" role="dialog" aria-label={texts.notificationsText}>
          <div className="notificationsHeader">{texts.notificationsText}</div>

          {list.length === 0 ? (
            <div className="notificationsEmpty">
              <span className="notificationsEmptyBell" aria-hidden="true">
                <BellIcon size={30} />
              </span>
              {texts.noNotificationsText}
            </div>
          ) : (
            <div className="notificationsList">
              {list.map((n, i) => {
                const chat = chats.find((c) => c.id === n.chatId);

                return (
                  <button
                    className="notificationsRow"
                    type="button"
                    key={n.chatId}
                    style={{ "--i": i } as React.CSSProperties}
                    onClick={() => openChat(n.chatId)}
                  >
                    <img
                      className="notificationsAvatar"
                      src={avatarUrl(chat?.avatar ?? null)}
                      alt=""
                      onError={handleAvatarError}
                    />

                    <span className="notificationsText">
                      <span className="notificationsTop">
                        <span className="notificationsTitle">
                          {chat?.title ?? n.lastSender ?? ""}
                        </span>
                        <span className="notificationsTime">{formatTime(n.lastTime)}</span>
                      </span>

                      <span className="notificationsBottom">
                        <span className="notificationsPreview">
                          {n.lastSender && <b>{n.lastSender}: </b>}
                          {n.lastText}
                        </span>
                        <span className="notificationsCount">{n.count > 99 ? "99+" : n.count}</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;