import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Texts, texts } from "./languages";

export interface User {
    nickname: string;
    username: string;
    id: number | null;
    password: string;
    language: keyof typeof texts;
    avatar: string;
    chats: number[];
}

export interface Chat {
    id: number;
    title: string;
    avatar: string | null;
}

export interface ChatMessage {
    text: string;
    id: number;
    sendTime: string;
    sender: {
        nickname: string;
        username: string;
        id: number | null;
        avatar: string | null;
        chats?: number[];
    };
    edited?: boolean;   // true after the sender changed the text
    replyToId?: number | null;   // the message this one replies to (null = not a reply)
}

/**
 * One notification = one chat with unread messages (never one per message).
 * The bell in the header lists these.
 */
export interface ChatNotification {
    chatId: number;
    count: number;              // how many unread messages
    lastText: string | null;    // the newest one, as a preview
    lastSender: string | null;  // who wrote it
    lastTime: string | null;    // when (ISO time)
}

/** what kind of line it is in the console: red, green or purple */
export type ConsoleMessageType = "error" | "success" | "info";

export interface ConsoleMessage {
    id: number;
    type: ConsoleMessageType;
    text: string;
    time: string;   // ISO time it happened, e.g. "2026-11-17T14:29:00.000Z"
}

/** the console keeps only this many lines (oldest ones are dropped) */
const MAX_CONSOLE_MESSAGES = 100;

/** gives every console line its own id */
let nextConsoleId = 1;

interface InitialState {
    loading: boolean;
    texts: Texts;
    isUserRegister: boolean;
    isConsoleOpen: boolean;      // true = full list, false = one-line bar
    isConsoleEnabled: boolean;   // false = a registered user closed it
    userId: number | null;
    isLogInModalOpen: boolean;
    isLogOnModalOpen: boolean;
    user: User;
    isSideBarOpen: boolean,
    chats: Chat[];
    chatsLoading: boolean;
    chat: ChatMessage[];
    console: ConsoleMessage[];
    chatReads: Record<string, number>;
    /** chats with unread messages, by chat id (for the bell) */
    notifications: Record<number, ChatNotification>;
    currentChatId: number | null;
}

const initialState: InitialState = {
    loading: true,
    texts: texts["en"],
    isUserRegister: false,
    isConsoleOpen: false,
    isConsoleEnabled: true,
    userId: null,
    isLogInModalOpen: false,
    isLogOnModalOpen: false,
    user: {
        nickname: "",
        username: "",
        id: null,
        password: "",
        language: "en",
        avatar: "",
        chats: []
    },
    isSideBarOpen: true,
    chats: [],
    chatsLoading: true,
    chat: [],
    console: [],
    chatReads: {},
    notifications: {},
    currentChatId: null
};

const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        onSetLoading: (
            state,
            action: PayloadAction<boolean>
        ) => {
            state.loading = action.payload;
        },

        // unknown language codes fall back to English instead of crashing the app
        onSetLanguage: (state, action: PayloadAction<string | null | undefined>) => {
            const all = texts as Record<string, Texts>;
            state.texts = (action.payload && all[action.payload]) || texts.en;
        },

        onSetUserStatus: (
            state,
            action: PayloadAction<boolean>
        ) => {
            state.isUserRegister = action.payload;
        },

        onSetUserId: (
            state,
            action: PayloadAction<number | null>
        ) => {
            state.userId = action.payload;
        },

        onSetLogInModal: (state) => {
            state.isLogInModalOpen =
                !state.isLogInModalOpen;
        },

        onSetLogOnModal: (state) => {
            state.isLogOnModalOpen =
                !state.isLogOnModalOpen;
        },

        onSetUser: (
            state,
            action: PayloadAction<User>
        ) => {
            state.user = {
                ...state.user,
                ...action.payload
            };
        },

        onSetUserChats: (
            state,
            action: PayloadAction<number>
        ) => {
            if (!state.user.chats.includes(action.payload)) {
                state.user.chats.push(action.payload);
            }
        },

        onSetChatsLoading: (
            state,
            action: PayloadAction<boolean>
        ) => {
            state.chatsLoading = action.payload;
        },

        onSetSideBarOpen: (state, action: PayloadAction<boolean>) => {
            state.isSideBarOpen = action.payload;
        },

        onSetChats: (
            state,
            action: PayloadAction<Chat[]>
        ) => {
            state.chats = action.payload;
        },

        onAddChat: (
            state,
            action: PayloadAction<Chat>
        ) => {
            const alreadyExists = state.chats.some(
                chat => chat.id === action.payload.id
            );

            if (!alreadyExists) {
                state.chats.push(action.payload);
            }
        },

        onSetCurrentChat: (
            state,
            action: PayloadAction<number | null>
        ) => {
            state.currentChatId =
                action.payload;
        },

        onAddMessage: (
            state,
            action: PayloadAction<ChatMessage>
        ) => {
            const alreadyExists = state.chat.some(
                message => message.id === action.payload.id
            );

            if (!alreadyExists) {
                state.chat.push(action.payload);
            }
        },

        // ---------------- console ----------------

        /**
         * Adds a line to the console and opens it.
         * Usage: dispatch(onAddConsoleMessage({ type: "error", text: "Server error" }))
         * (or the useNotify hook). The id and time are added automatically.
         */
        onAddConsoleMessage: {
            reducer: (state, action: PayloadAction<ConsoleMessage>) => {
                state.console.push(action.payload);

                // too many lines → drop the oldest
                if (state.console.length > MAX_CONSOLE_MESSAGES) {
                    state.console.splice(0, state.console.length - MAX_CONSOLE_MESSAGES);
                }

                state.isConsoleOpen = true;
            },
            prepare: (message: { type: ConsoleMessageType; text: string }) => ({
                payload: {
                    ...message,
                    id: nextConsoleId++,
                    time: new Date().toISOString(),
                },
            }),
        },

        // full list (true) or one-line bar (false)
        onSetConsoleOpen: (state, action: PayloadAction<boolean>) => {
            state.isConsoleOpen = action.payload;
        },

        // registered users can turn the console off (and on again)
        onSetConsoleEnabled: (state, action: PayloadAction<boolean>) => {
            state.isConsoleEnabled = action.payload;
        },

        onClearConsole: (state) => {
            state.console = [];
        },

        // a message was edited (by you or the other person)
        onUpdateMessage: (
            state,
            action: PayloadAction<ChatMessage>
        ) => {
            const index = state.chat.findIndex(
                message => message.id === action.payload.id
            );

            if (index !== -1) {
                state.chat[index] = action.payload;
            }
        },

        // a message was deleted for everyone
        onDeleteMessage: (
            state,
            action: PayloadAction<number>
        ) => {
            state.chat = state.chat.filter(
                message => message.id !== action.payload
            );
        },

        // how far everyone in the open chat has read (for the check marks)
        onSetChatReads: (
            state,
            action: PayloadAction<Record<string, number>>
        ) => {
            state.chatReads = action.payload;
        },

        // ---------------- notifications (the bell) ----------------

        // the whole list, when you sign in
        onSetNotifications: (state, action: PayloadAction<ChatNotification[]>) => {
            state.notifications = {};

            action.payload.forEach((notification) => {
                if (notification.count > 0) {
                    state.notifications[notification.chatId] = notification;
                }
            });
        },

        // one chat changed: new messages arrived, or you read them (count 0 = remove)
        onUpdateNotification: (state, action: PayloadAction<ChatNotification>) => {
            if (action.payload.count > 0) {
                state.notifications[action.payload.chatId] = action.payload;
            } else {
                delete state.notifications[action.payload.chatId];
            }
        },

        onSetChat: (
            state,
            action: PayloadAction<ChatMessage[]>
        ) => {
            state.chat = action.payload;
        },

        onRemoveChat: (
            state,
            action: PayloadAction<number>
        ) => {
            state.chats = state.chats.filter(
                chat => chat.id !== action.payload
            );

            state.user.chats =
                state.user.chats.filter(
                    chatId => chatId !== action.payload
                );

            delete state.notifications[action.payload];
        }
    }
});

export const {
    onSetUserStatus,
    onSetLanguage,
    onSetLoading,
    onSetUserId,
    onSetLogInModal,
    onSetLogOnModal,
    onSetUser,
    onSetUserChats,
    onSetChatsLoading,
    onSetSideBarOpen,
    onSetChats,
    onAddChat,
    onSetCurrentChat,
    onAddMessage,
    onAddConsoleMessage,
    onSetConsoleOpen,
    onSetConsoleEnabled,
    onClearConsole,
    onUpdateMessage,
    onDeleteMessage,
    onSetChat,
    onSetChatReads,
    onSetNotifications,
    onUpdateNotification,
    onRemoveChat
} = chatSlice.actions;

export default chatSlice.reducer;