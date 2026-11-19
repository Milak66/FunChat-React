import React, { useState } from "react";
import "./start.css";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import {
  onSetLanguage,
  onSetLogInModal,
  onSetLogOnModal,
  onSetUser,
  onSetSideBarOpen,
} from "../reduser/reduser";
import { texts as translations } from "../reduser/languages";
import UserProfile from "../userProfile/UserProfile";
import LanguageIcon from "../images/LanguageIcon";
import SettingsIcon from "../images/SettingsIcon";
import { useNotify } from "../hooks/useNotify";
import SidebarToggleIcon from "../images/SidebarToggleIcon";

interface StartProps {}

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const allLanguages: Language[] = [
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

// only show languages that have translations in languages.ts
// (picking one without translations used to crash the app)
const languages = allLanguages.filter(
  (language) => language.code in translations
);

const Start: React.FC<StartProps> = (): React.JSX.Element => {
  const texts = useSelector((state: RootState) => state.reduser.texts);

  const isUserRegister = useSelector(
    (state: RootState) => state.reduser.isUserRegister
  );

  const user = useSelector((state: RootState) => state.reduser.user);

  const userId = useSelector((state: RootState) => state.reduser.userId);

  const dispatch = useDispatch<AppDispatch>();
  // errors go to the console (bottom of the chat list)
  const notify = useNotify();

  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  // full chat screen mode: hides/shows the chat list (see mainContent)
  const isSideBarOpen = useSelector(
    (state: RootState) => state.reduser.isSideBarOpen
  );

  const setLanguage = async (lang: any) => {
    setIsLanguageModalOpen(false);

    // not signed in → just change it on this device
    if (!user.id) {
      dispatch(onSetLanguage(lang));
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/users/setLanguage/${
          user.id
        }?language=${encodeURIComponent(lang)}`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        notify("error", data.message || "Couldn't change the language");
        return;
      }

      dispatch(onSetLanguage(data.language));
      dispatch(onSetUser({ ...user, language: data.language }));
    } catch (err) {
      console.error(err);

      notify("error", "Server error");
    }
  };

  const showIcons = () => {
    if (!isUserRegister || !userId) {
      return (
        <button
          className="languageButton"
          onClick={() => setIsLanguageModalOpen(true)}
          aria-label="Change language"
          title="Change language"
        >
          <LanguageIcon />
        </button>
      );
    }
    return (
      <>
        <button
          className="languageButton"
          onClick={() => setIsLanguageModalOpen(true)}
          aria-label="Change language"
          title="Change language"
        >
          <LanguageIcon />
        </button>

        <button
          className="settingsButton"
          type="button"
          onClick={() => {}}
          aria-label="Settings"
          title="Settings"
        >
          <SettingsIcon />
        </button>
      </>
    );
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
            <button
              className="sidebarToggleBtn"
              type="button"
              onClick={() => dispatch(onSetSideBarOpen(!isSideBarOpen))}
              aria-label={isSideBarOpen ? "Hide chat list" : "Show chat list"}
              aria-pressed={!isSideBarOpen}
              title={isSideBarOpen ? "Hide chat list" : "Show chat list"}
            >
              <SidebarToggleIcon open={isSideBarOpen} />
            </button>

            <div className="siteName">FunChat</div>
          </div>

          <div className="startSettings">
            {showIcons()}
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
              aria-label="Close"
              onClick={() => setIsLanguageModalOpen(false)}
            >
              ×
            </button>

            <div className="languageModalHeader">
              {/* the same globe as the header button, not the 🌐 emoji */}
              <div className="languageModalIcon">
                <LanguageIcon size={28} />
              </div>

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