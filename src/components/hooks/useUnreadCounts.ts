import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { RootState, AppDispatch } from "../store/store";
import {
  ChatNotification,
  onSetNotifications,
  onUpdateNotification,
} from "../reduser/reduser";
import { subscribeToNotifications } from "../socket/socket";

/**
 * Keeps the unread counts of your chats up to date (state.reduser.notifications):
 * loads what arrived while you were away, then listens live.
 * The chat list shows them as purple circles with numbers.
 */
export function useUnreadCounts() {
  const dispatch = useDispatch<AppDispatch>();

  const userId = useSelector((state: RootState) => state.reduser.userId);

  useEffect(() => {
    if (!userId) {
      dispatch(onSetNotifications([]));
      return;
    }

    let cancelled = false;

    fetch(`${import.meta.env.VITE_SERVER_URL}/messages/unread/${userId}`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data: ChatNotification[]) => {
        if (!cancelled) {
          dispatch(onSetNotifications(data));
        }
      })
      .catch((error) => console.error("Couldn't load unread counts:", error));

    const subscription = subscribeToNotifications(userId, (notification) => {
      dispatch(onUpdateNotification(notification));
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [userId, dispatch]);
}