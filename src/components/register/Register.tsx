import React, { useState } from "react";
import "./register.css";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import {
  onSetLogInModal,
  onSetUser,
  onSetUserId,
  onSetUserStatus,
  onSetLanguage,
  User,
} from "../reduser/reduser";
import MiniLoading from "../animations/miniLoading/miniLoading";
import VerifyEmail from "./verifyEmail";
import GoogleSignInButton from "../googleSignIn/googleSignIn";
import { useNotify } from "../hooks/useNotify";

interface RegisterProps {}

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const MIN_PASSWORD_LENGTH = 6;

const Register: React.FC<RegisterProps> = (): React.JSX.Element => {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // set after a successful sign-up → shows the code screen
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const texts = useSelector((state: RootState) => state.reduser.texts);

  const dispatch = useDispatch<AppDispatch>();

  /** errors and successes go to the FunChat console instead of alert() */
  const notify = useNotify();

  const sendData = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading) return;

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanNickname = nickname.trim();

    if (!cleanUsername) {
      notify("error", texts.usernameMissingText);
      return;
    }

    if (!EMAIL_PATTERN.test(cleanEmail)) {
      notify("error", texts.emailInvalidText);
      return;
    }

    // the password is sent exactly as typed (spaces included),
    // so the user can log in with the same thing they typed here
    if (password.length < MIN_PASSWORD_LENGTH) {
      notify("error", texts.passwordShortText);
      return;
    }

    if (!cleanNickname) {
      notify("error", texts.nicknameMissingText);
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/users/addUser`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: cleanUsername,
            email: cleanEmail,
            password,
            nickname: cleanNickname,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // e.g. "This username is occupied!" or "This email is already registered"
        notify("error", data.message ?? texts.registerFailedText);
        return;
      }

      // account created but not confirmed yet → ask for the code
      setPendingEmail(data.email ?? cleanEmail);
    } catch (err) {
      console.error(err);
      notify("error", texts.registerFailedText);
    } finally {
      setIsLoading(false);
    }
  };

  // runs after the right code was entered (or after Google sign-in): log in
  const handleVerified = (user: User) => {
    dispatch(onSetUser(user));
    dispatch(onSetUserId(user.id));
    dispatch(onSetUserStatus(true));
    dispatch(onSetLanguage(user.language));
    localStorage.removeItem("temporaryMode");
    localStorage.setItem("userId", String(user.id));
    dispatch(onSetLogInModal());
  };

  if (pendingEmail) {
    return <VerifyEmail email={pendingEmail} onVerified={handleVerified} />;
  }

  return (
    <div className="logIn">
      <form className="userFormLogIn" onSubmit={sendData} noValidate>
        <div className="writeUserInfoDiv">
          <label className="writeUserInfoText" htmlFor="registerUsername">
            {texts.enterUserNameText}
          </label>
          <input
            id="registerUsername"
            className="inputText"
            type="text"
            autoComplete="username"
            placeholder={texts.inputText}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="writeUserInfoDiv">
          <label className="writeUserInfoText" htmlFor="registerEmail">
            {texts.enterEmailText}
          </label>
          <input
            id="registerEmail"
            className="inputText"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="writeUserInfoDiv">
          <label className="writeUserInfoText" htmlFor="registerPassword">
            {texts.enterPasswordText}
          </label>
          <input
            id="registerPassword"
            className="inputText"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            placeholder={texts.inputText}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="writeUserInfoDiv">
          <label className="writeUserInfoText" htmlFor="registerNickname">
            {texts.enterNicknameText}
          </label>
          <input
            id="registerNickname"
            className="inputText"
            type="text"
            autoComplete="nickname"
            placeholder={texts.inputText}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>

        <div className="submitBtnDiv">
          <button className="submitBtn" type="submit" disabled={isLoading}>
            {texts.registerText}
          </button>
        </div>

        {isLoading ? <MiniLoading /> : null}

        <GoogleSignInButton onLoggedIn={handleVerified} text="continue_with" />
      </form>
    </div>
  );
};

export default Register;
