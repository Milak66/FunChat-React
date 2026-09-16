import React, { useState } from "react";
import "./register.css";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import {
  onSetLogInModal,
  onSetUser,
  onSetUserId,
  onSetUserStatus,
} from "../reduser/reduser";
import { useEmojiModal } from "../hooks/useEmojiHook";
import MiniLoading from "../miniLoading/miniLoadin";

interface LogInProps {}

const LogIn: React.FC<LogInProps> = (): React.JSX.Element => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const texts = useSelector((state: RootState) => state.reduser.texts);

  const dispatch = useDispatch<AppDispatch>();
  const { showEmoji } = useEmojiModal();
  const sendData = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!username.trim()) {
      showEmoji(":(", "red", "Отсутствует имя пользователя");
      return;
    }

    if (username.trim().length > 10) {
      showEmoji(":(", "red", "Имя пользователя больше 10 символов");
      return;
    }

    if (password.trim().length < 6) {
      showEmoji(":(", "red", "Пароль не должен быть меньше 6 символов");
      return;
    }

    if (!nickname.trim()) {
      showEmoji(":(", "red", "Отсутствует ник");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("https://funchat-rwvy.onrender.com/users/addUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          nickname: nickname.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showEmoji(":(", "red", data.message || "Ошибка при регистрации");
        setIsLoading(false);
        return;
      }

      showEmoji(":)", "green", "Регистрация успешна");
      dispatch(onSetUser(data));
      dispatch(onSetUserId(data.id));
      dispatch(onSetUserStatus(true));
      setIsLoading(false);
      localStorage.removeItem("temporaryMode");
      localStorage.setItem("userId", String(data.id));
      dispatch(onSetLogInModal());
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      showEmoji(":(", "red", "Ошибка сервера");
    }
  };

  return (
    <div className="logIn">
      <form className="userFormLogIn" onSubmit={sendData}>
        <div className="writeUserInfoDiv">
          <label className="writeUserInfoText">{texts.enterUserNameText}</label>
          <input
            className="inputText"
            type="text"
            placeholder={texts.inputText}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="writeUserInfoDiv">
          <label className="writeUserInfoText">{texts.enterPasswordText}</label>
          <input
            className="inputText"
            type="password"
            placeholder={texts.inputText}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="writeUserInfoDiv">
          <label className="writeUserInfoText">{texts.enterNicknameText}</label>
          <input
            className="inputText"
            type="text"
            placeholder={texts.inputText}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>
        <div className="submitBtnDiv">
          <button className="submitBtn" type="submit">
            {texts.registerText}
          </button>
        </div>
        {isLoading ? <MiniLoading/> : null}
      </form>
    </div>
  );
};

export default LogIn;
