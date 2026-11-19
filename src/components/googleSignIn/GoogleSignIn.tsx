import React, { useEffect, useRef, useState } from "react";
import "./googleSignIn.css";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { User } from "../reduser/reduser";

// Google's script adds window.google
declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleSignInButtonProps {
  /** runs after the server accepted the Google account */
  onLoggedIn: (user: User) => void;
  /** wording on Google's button */
  text?: "signin_with" | "signup_with" | "continue_with";
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const SERVER = import.meta.env.VITE_SERVER_URL;
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

// the script is loaded once and shared by every button
let scriptPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("Could not load Google sign-in"));
      };
      document.head.appendChild(script);
    });
  }

  return scriptPromise;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onLoggedIn,
  text = "continue_with",
}): React.JSX.Element | null => {
  const texts = useSelector((state: RootState) => state.reduser.texts);

  const buttonRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  // keep the newest callback without re-rendering Google's button
  const onLoggedInRef = useRef(onLoggedIn);
  onLoggedInRef.current = onLoggedIn;

  const sendToServer = async (credential: string) => {
    setBusy(true);

    try {
      const response = await fetch(`${SERVER}/users/googleLogin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return;
      }

      onLoggedInRef.current(data);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const sendToServerRef = useRef(sendToServer);
  sendToServerRef.current = sendToServer;

  useEffect(() => {
    if (!CLIENT_ID) {
      return;
    }

    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        const container = buttonRef.current;

        if (cancelled || !container || !window.google?.accounts?.id) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response: { credential?: string }) => {
            if (response.credential) {
              sendToServerRef.current(response.credential);
            }
          },
        });

        container.innerHTML = "";

        // Google's button takes a width in pixels (max 400)
        const width = Math.min(Math.max(container.offsetWidth, 200), 400);

        window.google.accounts.id.renderButton(container, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text,
          logo_alignment: "center",
          width,
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [text]);

  // VITE_GOOGLE_CLIENT_ID not set → don't show anything
  if (!CLIENT_ID) {
    return null;
  }

  return (
    <div className="googleSignIn">
      <div className="authDivider">
        <span>{texts.orText}</span>
      </div>

      <div
        ref={buttonRef}
        className={`googleButton${busy ? " googleButtonBusy" : ""}`}
      />

      {failed && (
        <span className="googleError">
          Google sign-in couldn't load. Check your connection.
        </span>
      )}
    </div>
  );
};

export default GoogleSignInButton;
