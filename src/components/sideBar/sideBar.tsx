import React, { useEffect } from "react";
import "./sideBar.css";

import { RootState, AppDispatch } from "../store/store";

import { useSelector, useDispatch } from "react-redux";

import { onSetChats, onSetCurrentChat, onSetChatsLoading } from "../reduser/reduser";

import { useEmojiModal } from "../hooks/useEmojiHook";

import { NavLink } from "react-router-dom";

import userIcon from "../../assets/userIcon.jpg";

import MiniLoading from "../animations/miniLoading/miniLoadin";

interface ChatsSideBarProps {}

const SideBar: React.FC<ChatsSideBarProps> = (): React.JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();

  const { showEmoji } = useEmojiModal();

  const texts = useSelector((state: RootState) => state.reduser.texts);

  const userId = useSelector((state: RootState) => state.reduser.userId);

  const chats = useSelector((state: RootState) => state.reduser.chats);

  const chatsLoading = useSelector((state: RootState) => state.reduser.chatsLoading);

  useEffect(() => {
    if (!userId) {
      dispatch(onSetChats([]));
      dispatch(onSetChatsLoading(false));
      return;
    }

    const loadChats = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SERVER_URL}/chats/getChats/${userId}`
        );

        if (!response.ok) {
          dispatch(onSetChatsLoading(false));
          throw new Error("Couldn't load chats");
        }

        const data = await response.json();

        dispatch(onSetChats(data));
        dispatch(onSetChatsLoading(false));
      } catch (error) {
        console.error("Failed to load chats:", error);
        dispatch(onSetChatsLoading(false));
      }
    };

    loadChats();
  }, [userId, dispatch]);

  const openChat = async (chatId: number) => {
    if (!userId) {
      return;
    }

    dispatch(onSetCurrentChat(chatId));
  };

  const returnChats = () => {
    if (chats.length === 0) {
      return <div className="noChatsMessage">{texts.zeroChatsText}</div>;
    }

    return chats.map((chat) => (
      <div
        className="singleChat"
        key={chat.id}
        onClick={() => openChat(chat.id)}
      >
        {chat.avatar ?     <img
          className="chatAvatar"
          src={`${import.meta.env.VITE_SERVER_URL}${chat.avatar}`}
          alt={chat.title}
        /> : <img
        className="chatAvatar"
        src={userIcon}
        alt={chat.title}
      />}
        <div className="singleChatTitle">{chat.title}</div>
      </div>
    ));
  };

  return (
    <div className="sideBar">
      {chatsLoading ? <div style={{display: "flex", height: "100%", justifyContent: "center", alignItems: "center"}}><MiniLoading/></div> 
      : <> <div className="sideBarHeader"> 
        <div className="chatsSettings">
          <div className="chatsTitle">{texts.chatsText}</div>
          <div className="addBtnPlace">
            {userId ? (
              <NavLink to="/addChat">
                <button className="addBtn">+</button>
              </NavLink>
            ) : (
              <button
                className="addBtn"
                onClick={() => {
                  showEmoji(":(", "red", "You need to sign in first!");
                }}
              >
                +
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="chats">{returnChats()}</div></>}
    </div>
  );
};

export default SideBar;
