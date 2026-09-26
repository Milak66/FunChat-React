import { Client, StompSubscription } from "@stomp/stompjs";
import { ChatMessage } from "../reduser/reduser";

let socket: Client | null = null;

export const connectSocket = () => {

    if (socket?.active) {
        return socket;
    }

    socket = new Client({
        brokerURL: `ws://${import.meta.env.VITE_SERVER_SOCKET_URL}/ws`,

        reconnectDelay: 5000,

        onConnect: () => {
            console.log("WebSocket connected");
        },

        onDisconnect: () => {
            console.log("WebSocket disconnected");
        },

        onStompError: (frame) => {
            console.error(
                "STOMP error:",
                frame.headers["message"],
                frame.body
            );
        },

        onWebSocketError: (error) => {
            console.error(
                "WebSocket error:",
                error
            );
        }
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
};

export const subscribeToChat = (
    chatId: number,
    onMessage: (message: ChatMessage) => void
): StompSubscription | null => {

    console.log("Subscribing to chat:", chatId);

    if (!socket?.connected) {
        console.error("Socket is not connected");
        return null;
    }

    return socket.subscribe(
        `/topic/chat/${chatId}`,
        (message) => {

            console.log(
                "Received WebSocket message:",
                message.body
            );

            const data: ChatMessage =
                JSON.parse(message.body);

            onMessage(data);
        }
    );
};

export interface TypingEvent {
    chatId: number;
    userId: number;
    typing: boolean;
}

export const subscribeToTyping = (
    chatId: number,
    onTyping: (event: TypingEvent) => void
): StompSubscription | null => {

    console.log(
        "Subscribing to typing:",
        chatId
    );

    if (!socket?.connected) {
        console.error("Socket is not connected");
        return null;
    }

    return socket.subscribe(
        `/topic/chat/${chatId}/typing`,
        (message) => {

            console.log(
                "Received typing event:",
                message.body
            );

            const data: TypingEvent =
                JSON.parse(message.body);

            onTyping(data);
        }
    );
};

export const sendTyping = (
    chatId: number,
    userId: number,
    typing: boolean
) => {

    if (!socket?.connected) {
        console.error(
            "Cannot send typing event: socket is not connected"
        );
        return;
    }

    socket.publish({
        destination: "/app/typing",

        body: JSON.stringify({
            chatId,
            userId,
            typing
        })
    });
};