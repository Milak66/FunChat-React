import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import { ChatMessage, ChatNotification } from "../reduser/reduser";

export interface TypingEvent {
  chatId: number;
  userId: number;
  typing: boolean;
  /** name to show in "Alexey is typing" (sent by the server) */
  nickname?: string;
}

/** What subscribeToChat / subscribeToTyping return. */
export interface Subscription {
  unsubscribe: () => void;
}

interface Listener {
  topic: string;
  onMessage: (message: IMessage) => void;
  subscription: StompSubscription | null;
}

let socket: Client | null = null;

// Every chat/typing subscription the app asked for. They are (re)subscribed
// automatically whenever the socket connects, so opening a chat before the
// socket is ready, or losing the connection for a moment, no longer breaks
// live messages.
const listeners = new Map<number, Listener>();
let nextListenerId = 1;

const SERVER_URL = String(import.meta.env.VITE_SERVER_URL ?? "");

/** wss:// when the server is https (needed on Render), ws:// locally. */
function getSocketUrl(): string {
  const secure = SERVER_URL
    ? SERVER_URL.startsWith("https")
    : window.location.protocol === "https:";

  const socketHost = import.meta.env.VITE_SERVER_SOCKET_URL as string | undefined;

  if (socketHost) {
    const host = socketHost.replace(/^(wss?|https?):\/\//, "").replace(/\/$/, "");
    return `${secure ? "wss" : "ws"}://${host}/ws`;
  }

  return `${SERVER_URL.replace(/^http/, "ws").replace(/\/$/, "")}/ws`;
}

function attach(listener: Listener) {
  if (!socket?.connected || listener.subscription) {
    return;
  }

  listener.subscription = socket.subscribe(listener.topic, listener.onMessage);
}

export const connectSocket = () => {
  if (socket?.active) {
    return socket;
  }

  socket = new Client({
    brokerURL: getSocketUrl(),

    reconnectDelay: 5000,

    onConnect: () => {
      console.log("WebSocket connected");

      // old subscriptions die with the old connection → subscribe again
      listeners.forEach((listener) => {
        listener.subscription = null;
        attach(listener);
      });
    },

    onWebSocketClose: () => {
      listeners.forEach((listener) => {
        listener.subscription = null;
      });
    },

    onStompError: (frame) => {
      console.error("STOMP error:", frame.headers["message"], frame.body);
    },

    onWebSocketError: (error) => {
      console.error("WebSocket error:", error);
    },
  });

  socket.activate();

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.deactivate();
    socket = null;
  }

  listeners.forEach((listener) => {
    listener.subscription = null;
  });
};

function listen(topic: string, onMessage: (message: IMessage) => void): Subscription {
  const id = nextListenerId++;

  const listener: Listener = { topic, onMessage, subscription: null };

  listeners.set(id, listener);
  attach(listener);

  return {
    unsubscribe: () => {
      try {
        listener.subscription?.unsubscribe();
      } catch {
        // the connection is already closed, nothing to unsubscribe from
      }

      listeners.delete(id);
    },
  };
}

function parse<T>(message: IMessage): T | null {
  try {
    return JSON.parse(message.body) as T;
  } catch (error) {
    console.error("Could not read WebSocket message:", error);
    return null;
  }
}

export const subscribeToChat = (
  chatId: number,
  onMessage: (message: ChatMessage) => void
): Subscription => {
  return listen(`/topic/chat/${chatId}`, (message) => {
    const data = parse<ChatMessage>(message);

    if (data) {
      onMessage(data);
    }
  });
};

export const subscribeToTyping = (
  chatId: number,
  onTyping: (event: TypingEvent) => void
): Subscription => {
  return listen(`/topic/chat/${chatId}/typing`, (message) => {
    const data = parse<TypingEvent>(message);

    if (data) {
      onTyping(data);
    }
  });
};

/** An edited or deleted message, sent by the server to everyone in the chat. */
export type MessageUpdate =
  | { type: "edit"; message: ChatMessage }
  | { type: "delete"; messageId: number }
  | { type: "clear"; chatId: number };   // the whole history was cleared

export const subscribeToMessageUpdates = (
  chatId: number,
  onUpdate: (update: MessageUpdate) => void
): Subscription => {
  return listen(`/topic/chat/${chatId}/updates`, (message) => {
    const data = parse<MessageUpdate>(message);

    if (data) {
      onUpdate(data);
    }
  });
};

/**
 * Your notifications, live: whenever a chat of yours gets new messages
 * (or you read them), the server sends that chat's notification here.
 */
export const subscribeToNotifications = (
  userId: number,
  onNotification: (notification: ChatNotification) => void
): Subscription => {
  return listen(`/topic/user/${userId}/notifications`, (message) => {
    const data = parse<ChatNotification>(message);

    if (data) {
      onNotification(data);
    }
  });
};

/** Someone in the chat read further: { userId: newest message id they've seen }. */
export interface ReadEvent {
  chatId: number;
  reads: Record<string, number>;
}

export const subscribeToReads = (
  chatId: number,
  onRead: (event: ReadEvent) => void
): Subscription => {
  return listen(`/topic/chat/${chatId}/read`, (message) => {
    const data = parse<ReadEvent>(message);

    if (data) {
      onRead(data);
    }
  });
};

/**
 * Tells the other people in the chat that you started/stopped typing.
 *
 * Sent as a normal HTTP request (like sending a message). The server then
 * passes it on over the WebSocket to /topic/chat/{chatId}/typing, the same
 * way new messages reach everyone.
 */
export const sendTyping = (chatId: number, userId: number, typing: boolean) => {
  fetch(`${SERVER_URL.replace(/\/$/, "")}/typing`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, userId, typing }),
    keepalive: true, // still sent if you close the tab while typing
  }).catch(() => {
    // "typing…" isn't important enough to show an error for
  });
};