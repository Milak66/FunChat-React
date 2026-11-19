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
import { useNotify } from "../hooks/useNotify";

interface LogOnProps {}

const LogOn: React.FC<LogOnProps> = (): React.JSX.Element => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // set after the right password → shows the email code screen
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const texts = useSelector((state: RootState) => state.reduser.texts);

  const dispatch = useDispatch<AppDispatch>();

  /** errors and successes go to the FunChat console */
  const notify = useNotify();

  // runs after the right code was entered (or after Google sign-in)
  const logInUser = (user: User) => {
    dispatch(onSetUser(user));
    dispatch(onSetUserId(user.id));
    dispatch(onSetUserStatus(true));
    dispatch(onSetLanguage(user.language));
    localStorage.removeItem("temporaryMode");
    localStorage.setItem("userId", String(user.id));
    dispatch(onSetLogOnModal());
    notify("success", texts.loggedInText);
  };

  const getUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading) return;

    const cleanUsername = username.trim();

    if (!cleanUsername) {
      notify("error", texts.loginIdMissingText);
      return;
    }

    if (!password) {
      notify("error", texts.passwordMissingText);
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
            username: cleanUsername,
            // exactly as typed, the same way register.tsx saves it
            password,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      // right password → the server emailed a code → code screen
      if (response.status === 202 && data.email) {
        notify("info", texts.codeSentText);
        setPendingEmail(data.email);
        return;
      }

      if (response.status === 401) {
        notify("error", texts.wrongCredentialsText);
        return;
      }

      if (!response.ok) {
        notify("error", data.message ?? texts.logInFailedText);
        return;
      }

      logInUser(data);
    } catch (err) {
      console.error(err);
      notify("error", texts.logInFailedText);
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingEmail) {
    return <VerifyEmail email={pendingEmail} onVerified={logInUser} />;
  }

  return (
    <div className="logOn">
      <form className="userFormLogOn" onSubmit={getUser} noValidate>
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