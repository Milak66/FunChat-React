import React, { useState } from "react";
import "./logIn.css";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import {
  onSetUserStatus,
  onSetLogOnModal,
  onSetUser,
  onSetUserId,
} from "../reduser/reduser";
import { useEmojiModal } from "../hooks/useEmojiHook";
import MiniLoading from "../miniLoading/miniLoadin";

interface LogOnProps {}

const LogOn: React.FC<LogOnProps> = (): React.JSX.Element => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const texts = useSelector((state: RootState) => state.reduser.texts);

  const dispatch = useDispatch<AppDispatch>();
  const { showEmoji } = useEmojiModal();

  const getUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!username.trim()) {
      showEmoji(":(", "red", "Enter a username");
      return;
    }

    if (!password.trim()) {
      showEmoji(":(", "red", "Enter a password");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/users/getUserByProperties`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      if (!response.ok) {
        showEmoji(":(", "red", "Coudn't find the user");
  
        return;
      }

      const correctUser = await response.json();

      dispatch(onSetUser(correctUser));
      dispatch(onSetUserId(correctUser.id));
      dispatch(onSetUserStatus(true));

      localStorage.removeItem("temporaryMode");
      localStorage.setItem("userId", String(correctUser.id));
      dispatch(onSetLogOnModal());

      showEmoji(":)", "green", "You have successfully logged into your account.");
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      showEmoji(":(", "red", "Something went wrong!");
    }
  };

  return (
    <div className="logOn">
      <form className="userFormLogOn" onSubmit={getUser}>
        <div className="writeUserInfoDiv">
          <label className="writeUserInfoText">{texts.enterUserNameText}</label>
          <input
            className="inputText"
            type="text"
            value={username}
            placeholder={texts.inputText}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="writeUserInfoDiv">
          <label className="writeUserInfoText">{texts.enterPasswordText}</label>
          <input
            className="inputText"
            type="password"
            value={password}
            placeholder={texts.inputText}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="submitBtnDiv">
          <button className="submitBtn" type="submit">
            {texts.logInText}
          </button>
        </div>
        {isLoading ? <MiniLoading/> : null}
      </form>
    </div>
  );
};

export default LogOn;
