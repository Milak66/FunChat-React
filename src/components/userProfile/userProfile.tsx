import React, { useState } from "react";
import "./userProfile.css";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import {
  onSetUserStatus,
  onSetUser,
  onSetUserId,
  onSetCurrentChat,
} from "../reduser/reduser";
import { useEmojiModal } from "../hooks/useEmojiHook";
import AvatarEditor from "../avatarEditor/avatarEditor";
import userIcon from "../../assets/userIcon.jpg";

interface UserProfileProps {}

const UserProfile: React.FC<UserProfileProps> = (): React.JSX.Element => {
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const texts = useSelector((state: RootState) => state.reduser.texts);

  const user = useSelector((state: RootState) => state.reduser.user);

  const dispatch = useDispatch<AppDispatch>();
  const { showEmoji } = useEmojiModal();

  const handleOpenSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  const quitFromProfile = () => {
    dispatch(
      onSetUser({
        nickname: "",
        username: "",
        id: null,
        password: "",
        language: "en",
        avatar: "",
        chats: [],
      })
    );
    dispatch(onSetUserId(null));
    dispatch(onSetUserStatus(false));
    dispatch(onSetCurrentChat(null));
    localStorage.removeItem("userId");
    showEmoji(":)", "green", "Exit successfully completed");
  };

  const deleteAccount = async () => {
    try {
      fetch(`${import.meta.env.VITE_SERVER_URL}/users/deleteUser/${user?.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      showEmoji(":)", "green", "Account has been successfully deleted");
      dispatch(
        onSetUser({
          nickname: "",
          username: "",
          id: null,
          password: "",
          language: "en",
          avatar: "",
          chats: [],
        })
      );
      dispatch(onSetUserId(null));
      dispatch(onSetUserStatus(false));
      dispatch(onSetCurrentChat(null));
      localStorage.removeItem("userId");
    } catch (err) {
      console.error(err);
      showEmoji(":(", "red", "Server error");
    }
  };

  const returnProfileSettings = () => {
    if (!isSettingsOpen) return null;

    return (
      <div className="profileSettings">
        <div className="settingsUserName">@{user?.username}</div>

        <AvatarEditor userId={user.id} currentAvatar={user.avatar} />

        <button className="quitBtn" onClick={quitFromProfile}>
          {texts.logOutText}
        </button>

        <button className="deleteBtn" onClick={deleteAccount}>
          {texts.deleteAccountText}
        </button>
      </div>
    );
  };

  return (
    <div className="userProfile">
      <div className="profile" onClick={handleOpenSettings}>
        <div className="username">{user?.nickname}</div>
        {user.avatar ? <img
          className="profileAvatar"
          src={`${import.meta.env.VITE_SERVER_URL}${user.avatar}`}
          alt="Avatar"
        /> : <img
          className="profileAvatar"
          src={userIcon}
          alt="Avatar"
      />}
      </div>

      {returnProfileSettings()}
    </div>
  );
};

export default UserProfile;
