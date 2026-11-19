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
import MiniLoading from "../animations/miniLoading/MiniLoading";
import VerifyEmail from "./VerifyEmail";
import GoogleSignInButton from "../googleSignIn/GoogleSignIn";

interface LogInProps {}

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const LogIn: React.FC<LogInProps> = (): React.JSX.Element => {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // set after a successful sign-up → shows the code screen
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const texts = useSelector((state: RootState) => state.reduser.texts);

  const dispatch = useDispatch<AppDispatch>();
  const sendData = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading) return;

    const cleanEmail = email.trim().toLowerCase();

    if (!username.trim()) {
<<<<<<< HEAD
      return;
    }

    if (username.trim().length > 10) {
      return;
    }

    if (!EMAIL_PATTERN.test(cleanEmail)) {
=======
      showEmoji(":(", "red", "The username is missing");
>>>>>>> 0d9a1f8fd43e3ba90b70101138fca205f068d086
      return;
    }

    if (password.trim().length < 6) {
<<<<<<< HEAD
=======
      showEmoji(":(", "red", "The password must be at least 6 characters long");
>>>>>>> 0d9a1f8fd43e3ba90b70101138fca205f068d086
      return;
    }

    if (!nickname.trim()) {
<<<<<<< HEAD
=======
      showEmoji(":(", "red", "The username is missing");
>>>>>>> 0d9a1f8fd43e3ba90b70101138fca205f068d086
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
            username: username.trim(),
            email: cleanEmail,
            password: password.trim(),
            nickname: nickname.trim(),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return;
      }

      // account created but not confirmed yet → ask for the code
      setPendingEmail(data.email ?? cleanEmail);
    } catch (err) {
      console.error(err);
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
      <form className="userFormLogIn" onSubmit={sendData}>
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

export default LogIn;
