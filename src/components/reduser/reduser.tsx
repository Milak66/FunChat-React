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
    avatar: string;
}

export interface ChatMessage {
    text: string;
    id: number;
    sendTime: string;
    sender: {
        nickname: string;
        username: string;
        id: number | null;
        avatar: string;
        chats: number[];
    };
}

export interface EmojiModalState {
    isOpen: boolean;
    emoji: string;
    color: "red" | "green";
    text: string;
}

interface InitialState {
    loading: boolean;
    texts: Texts;
    isUserRegister: boolean;
    userId: number | null;
    emojiModal: EmojiModalState;
    isLogInModalOpen: boolean;
    isLogOnModalOpen: boolean;
    user: User;
    chats: Chat[];
    chatsLoading: boolean;
    chat: ChatMessage[];
    currentChatId: number | null;
}

const initialState: InitialState = {
    loading: true,
    texts: texts["en"],
    isUserRegister: false,
    userId: null,
    emojiModal: {
        isOpen: false,
        emoji: "",
        color: "green",
        text: ""
    },
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
    chats: [],
    chatsLoading: true,
    chat: [],
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

        onSetLanguage: (state, action: PayloadAction<keyof typeof texts>) => {
            state.texts = texts[action.payload];
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

        showEmojiModal: (
            state,
            action: PayloadAction<{
                emoji: string;
                color: "red" | "green";
                text: string;
            }>
        ) => {
            state.emojiModal = {
                isOpen: true,
                ...action.payload
            };
        },

        hideEmojiModal: (state) => {
            state.emojiModal.isOpen = false;
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
            state.chat.push(action.payload);
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
    showEmojiModal,
    hideEmojiModal,
    onSetUserChats,
    onSetChatsLoading,
    onSetChats,
    onAddChat,
    onSetCurrentChat,
    onAddMessage,
    onSetChat,
    onRemoveChat
} = chatSlice.actions;

export default chatSlice.reducer;