import React from "react";
import { useSelector } from "react-redux";
import "./mainContent.css";
import { RootState } from "../store/store";
import SideBar from "../sideBar/SideBar";
import Chat from "../chat/Chat";
import Console from "../helper/Helper";

interface MainContentProps {}

const MainContent: React.FC<MainContentProps> = (): React.JSX.Element => {
  const isSideBarOpen = useSelector(
    (state: RootState) => state.reduser.isSideBarOpen
  );

  const currentChatId = useSelector(
    (state: RootState) => state.reduser.currentChatId
  );

  const className = [
    "mainContent",
    currentChatId ? "chatOpen" : "",
    // full chat screen mode: the chat list slides away (see mainContent.css)
    isSideBarOpen ? "" : "sideBarHidden",
  ]
    .filter(Boolean)
    .join(" ");

  // the chat list is hidden with CSS instead of being removed, so it doesn't
  // reload all your chats every time you open it again
  return (
    <div className={className}>
      <SideBar />
      <Chat />

      {/* errors, successes and notifications, at the bottom of the chat list */}
      <Console />
    </div>
  );
};

export default MainContent;