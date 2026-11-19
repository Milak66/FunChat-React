import React, { useState } from "react";
import "./logOn.css";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import {
  onSetUserStatus,
  onSetLogOnModal,
  onSetUser,
  onSetUserId,
  onSetLanguage,
  User,
} from "../reduser/reduser";
import MiniLoading from "../animations/miniLoading/MiniLoading";
import VerifyEmail from "../register/VerifyEmail";
import GoogleSignInButton from "../googleSignIn/GoogleSignIn";

interface LogOnProps {}

const LogOn: React.FC<LogOnProps> = (): React.JSX.Element => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // set after the right password → shows the email code screen
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const texts = useSelector((state: RootState) => state.reduser.texts);

  const dispatch = useDispatch<AppDispatch>();

  const logInUser = (user: User) => {
    dispatch(onSetUser(user));
    dispatch(onSetUserId(user.id));
    dispatch(onSetUserStatus(true));
    dispatch(onSetLanguage(user.language));
    localStorage.removeItem("temporaryMode");
    localStorage.setItem("userId", String(user.id));
    dispatch(onSetLogOnModal());
  };

  const getUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading) return;

    if (!username.trim()) {
      return;
    }

    if (!password.trim()) {
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/users/getUserByProperties`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim(),
            password: password.trim(),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      // right password → the server emailed a code → code screen
      if (response.status === 202 && data.email) {
        setPendingEmail(data.email);
        return;
      }

      if (response.status === 401) {
        return;
      }

      if (!response.ok) {
        return;
      }

<<<<<<< HEAD:src/components/logOn/LogOn.tsx
      logInUser(data);
=======
      showEmoji(
        ":)",
        "green",
        "You have successfully logged into your account"
      );
>>>>>>> 0d9a1f8fd43e3ba90b70101138fca205f068d086:src/components/logIn/logIn.tsx
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingEmail) {
    return <VerifyEmail email={pendingEmail} onVerified={logInUser} />;
  }

  return (
    <div className="logOn">
      <form className="userFormLogOn" onSubmit={getUser}>
        <div className="writeUserInfoDiv">
          <label className="writeUserInfoText" htmlFor="logOnUsername">
            {texts.usernameOrEmailText}
          </label>
          <input
            id="logOnUsername"
            className="inputText"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            value={username}
            placeholder={texts.inputText}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="writeUserInfoDiv">
          <label className="writeUserInfoText" htmlFor="logOnPassword">
            {texts.enterPasswordText}
          </label>
          <input
            id="logOnPassword"
            className="inputText"
            type="password"
            autoComplete="current-password"
            value={password}
            placeholder={texts.inputText}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="submitBtnDiv">
          <button className="submitBtn" type="submit" disabled={isLoading}>
            {texts.logInText}
          </button>
        </div>

        {isLoading ? <MiniLoading /> : null}

        <GoogleSignInButton onLoggedIn={logInUser} text="continue_with" />
      </form>
    </div>
  );
};

export default LogOn;
