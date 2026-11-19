import React, { useEffect, useRef, useState } from "react";
import "./userProfile.css";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store/store.ts";
import {
  onSetUserStatus,
  onSetUser,
  onSetUserId,
  onSetCurrentChat,
  onSetChat,
} from "../reduser/reduser.ts";
import AvatarEditor from "../avatarEditor/avatarEditor.tsx";
import { avatarUrl, handleAvatarError } from "../avatarEditor/avatarUrl.ts";

interface UserProfileProps {}

const UserProfile: React.FC<UserProfileProps> = (): React.JSX.Element => {
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const profileRef = useRef<HTMLDivElement>(null);

  const texts = useSelector((state: RootState) => state.reduser.texts);

  const user = useSelector((state: RootState) => state.reduser.user);

  const dispatch = useDispatch<AppDispatch>();

  // close the menu when clicking anywhere outside it
  // (except the avatar crop window, which is shown on top of everything)
  useEffect(() => {
    if (!isSettingsOpen) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (
        profileRef.current?.contains(target) ||
        target.closest(".avatarModal")
      ) {
        return;
      }

      setIsSettingsOpen(false);
    };

    document.addEventListener("mousedown", handleClick);

    return () => document.removeEventListener("mousedown", handleClick);
  }, [isSettingsOpen]);

  const resetUser = () => {
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
    dispatch(onSetChat([]));
    localStorage.removeItem("userId");
    setIsSettingsOpen(false);
  };

  const quitFromProfile = () => {
    resetUser();
  };

  const deleteAccount = async () => {
    if (!user.id || isDeleting) {
      return;
    }

    if (
      !window.confirm(
        "Delete your account? All your chats and messages will be deleted too. This can't be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/users/deleteUser/${user.id}`,
        { method: "DELETE" }
      );

      // 404 = already deleted, which is fine too
      if (!response.ok && response.status !== 404) {
        return;
      }

      resetUser();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const returnProfileSettings = () => {
    if (!isSettingsOpen) return null;

    return (
      <div className="profileSettings">
        <div className="settingsUserName">@{user?.username}</div>

        <AvatarEditor
          userId={user.id}
          currentAvatar={user.avatar}
          onAvatarChanged={(avatar) => dispatch(onSetUser({ ...user, avatar }))}
        />

        <button className="quitBtn" onClick={quitFromProfile}>
          {texts.logOutText}
        </button>

        <button
          className="deleteBtn"
          onClick={deleteAccount}
          disabled={isDeleting}
        >
          {texts.deleteAccountText}
        </button>
      </div>
    );
  };

  return (
    <div className="userProfile" ref={profileRef}>
      <div
        className="profile"
        role="button"
        tabIndex={0}
        aria-expanded={isSettingsOpen}
        onClick={() => setIsSettingsOpen((open) => !open)}
        onKeyDown={(e) => {
          if (e.key === "Enter") setIsSettingsOpen((open) => !open);
        }}
      >
        <div className="username">{user?.nickname}</div>
        <img
          className="profileAvatar"
          src={avatarUrl(user.avatar)}
          alt=""
          onError={handleAvatarError}
        />
      </div>

      {returnProfileSettings()}
    </div>
  );
};

export default UserProfile;
