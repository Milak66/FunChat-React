import React, { useEffect, useState } from "react";
import "./register.css";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { User } from "../reduser/reduser";

interface VerifyEmailProps {
  email: string;
  onVerified: (user: User) => void;
  /** true when opened from log in: the old code may have expired, so send a fresh one */
  sendCodeOnOpen?: boolean;
}

const SERVER = import.meta.env.VITE_SERVER_URL;
const COOLDOWN_SECONDS = 60;

const VerifyEmail: React.FC<VerifyEmailProps> = ({
  email,
  onVerified,
  sendCodeOnOpen = false,
}): React.JSX.Element => {
  const texts = useSelector((state: RootState) => state.reduser.texts);

  const [code, setCode] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [checking, setChecking] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(sendCodeOnOpen ? 0 : COOLDOWN_SECONDS);

  // countdown for the "send a new code" button
  useEffect(() => {
    if (cooldown <= 0) return;

    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);

    return () => clearTimeout(id);
  }, [cooldown]);

  const resend = async () => {
    setError("");

    try {
      const res = await fetch(`${SERVER}/users/resendCode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setCooldown(COOLDOWN_SECONDS);
        setCode("");
      } else if (res.status === 429) {
        setCooldown(data.secondsLeft ?? COOLDOWN_SECONDS);
      } else {
        setError(data.message ?? "Could not send a new code");
      }
    } catch {
      setError("No connection to the server");
    }
  };

  // coming from log in → send a fresh code right away
  useEffect(() => {
    if (sendCodeOnOpen) {
      resend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (code.length !== 6 || checking) return;

    setChecking(true);
    setError("");

    try {
      const res = await fetch(`${SERVER}/users/verifyEmail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        onVerified(data);
      } else if (res.status === 400) {
        setError(`Wrong code. ${data.attemptsLeft ?? 0} tries left.`);
        setCode("");
      } else {
        setError(data.message ?? "Something went wrong");
      }
    } catch {
      setError("No connection to the server");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="logIn">
      <form className="userFormLogIn" onSubmit={submit}>
        <div className="writeUserInfoDiv">
          <label className="writeUserInfoText" htmlFor="verifyCode">
            {texts.enterCodeText} {email}
          </label>

          <input
            id="verifyCode"
            className="inputText verifyCodeInput"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            autoFocus
          />

          {error && <span className="verifyError">{error}</span>}
        </div>

        <div className="submitBtnDiv">
          <button
            className="submitBtn"
            type="submit"
            disabled={code.length !== 6 || checking}
          >
            {checking ? "..." : texts.confirmText}
          </button>
        </div>

        <button
          type="button"
          className="resendCodeBtn"
          onClick={resend}
          disabled={cooldown > 0}
        >
          {cooldown > 0
            ? `${texts.resendCodeText} (${cooldown}s)`
            : texts.resendCodeText}
        </button>
      </form>
    </div>
  );
};

export default VerifyEmail;