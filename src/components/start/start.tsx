import React, { useState } from "react";
import "./start.css";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import {
  onSetLanguage,
  onSetLogInModal,
  onSetLogOnModal,
} from "../reduser/reduser";
import UserProfile from "../userProfile/userProfile";
import languageImage from "../../assets/languageImage.jpg";
import { useEmojiModal } from "../hooks/useEmojiHook";

interface StartProps {}

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  {
    code: "id",
    name: "Indonesian",
    nativeName: "Bahasa Indonesia",
    flag: "🇮🇩",
  },
  { code: "sv", name: "Swedish", nativeName: "Svenska", flag: "🇸🇪" },
  { code: "no", name: "Norwegian", nativeName: "Norsk", flag: "🇳🇴" },
  { code: "da", name: "Danish", nativeName: "Dansk", flag: "🇩🇰" },
  { code: "fi", name: "Finnish", nativeName: "Suomi", flag: "🇫🇮" },
  { code: "cs", name: "Czech", nativeName: "Čeština", flag: "🇨🇿" },
  { code: "ro", name: "Romanian", nativeName: "Română", flag: "🇷🇴" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", flag: "🇬🇷" },
  { code: "he", name: "Hebrew", nativeName: "עברית", flag: "🇮🇱" },
  { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
  { code: "fil", name: "Filipino", nativeName: "Filipino", flag: "🇵🇭" },
];

const Start: React.FC<StartProps> = (): React.JSX.Element => {
  const texts = useSelector((state: RootState) => state.reduser.texts);

  const isUserRegister = useSelector(
    (state: RootState) => state.reduser.isUserRegister
  );

  const user = useSelector((state: RootState) => state.reduser.user);

  const dispatch = useDispatch<AppDispatch>();
  const { showEmoji } = useEmojiModal();

  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  const setLanguage = async (lang: string) => {
    if (!user.id) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.SERVER_URL}/users/setLanguage/${
          user.id
        }?language=${encodeURIComponent(lang)}`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showEmoji(":(", "red", data.message || "Couldn't change the language");
        return;
      }

      dispatch(onSetLanguage(data.language));
    } catch (err) {
      console.error(err);

      showEmoji(":(", "red", "Server error");
    }
  };

  const showUserOrBtn = () => {
    if (isUserRegister && user.id) {
      return <UserProfile />;
    }

    return (
      <div className="btnsDiv">
        <button className="btn" onClick={() => dispatch(onSetLogOnModal())}>
          {texts.logInText}
        </button>

        <button className="btn" onClick={() => dispatch(onSetLogInModal())}>
          {texts.createAccountText}
        </button>
      </div>
    );
  };

  return (
    <>
      <div className="start">
        <div className="menu">
          <div className="logoOfSite">
            <div className="siteName">FunChat</div>
          </div>

          <div className="startSettings">
            <button
              className="languageButton"
              onClick={() => setIsLanguageModalOpen(true)}
              aria-label="Change language"
            >
              <img
                className="modeButtonImg"
                src={languageImage}
                alt="Language"
              />
            </button>
          </div>

          {showUserOrBtn()}
        </div>
      </div>

      {isLanguageModalOpen && (
        <div
          className="languageModalOverlay"
          onClick={() => setIsLanguageModalOpen(false)}
        >
          <div className="languageModal" onClick={(e) => e.stopPropagation()}>
            <button
              className="languageModalClose"
              onClick={() => setIsLanguageModalOpen(false)}
            >
              ×
            </button>

            <div className="languageModalHeader">
              <div className="languageModalIcon">🌐</div>

              <div>
                <h2>Choose your language</h2>

                <p>Select the language you want to use in FunChat</p>
              </div>
            </div>

            <div className="languageGrid">
              {languages.map((language) => (
                <button
                  key={language.code}
                  className="languageOption"
                  onClick={() => setLanguage(language.code)}
                >
                  <span className="languageFlag">{language.flag}</span>

                  <span className="languageNames">
                    <span className="languageName">{language.nativeName}</span>

                    <span className="languageEnglishName">{language.name}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Start;
