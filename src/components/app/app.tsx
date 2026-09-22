import React, { useEffect } from "react";
import "./app.css";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import {
  onSetLoading,
  onSetLanguage,
  onSetLogInModal,
  onSetLogOnModal,
  onSetUserStatus,
  onSetUser,
  onSetUserId,
} from "../reduser/reduser";
import Loading from "../animations/loading/loading";
import Start from "../start/start";
import LogIn from "../register/register";
import LogOn from "../logIn/logIn";
import MainContent from "../mainContent/mainContent";
import AddChat from "../addChat/addChat";
import { EmojiModal } from "../hooks/emojiModal";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { connectSocket, disconnectSocket } from "../socket/socket";
import { useEmojiModal } from "../hooks/useEmojiHook";

interface AppProps {}

const App: React.FC<AppProps> = (): React.JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();

  const loading = useSelector((state: RootState) => state.reduser.loading);

  const emojiModal = useSelector(
    (state: RootState) => state.reduser.emojiModal
  );

  const isLoginInModalOpen = useSelector(
    (state: RootState) => state.reduser.isLogInModalOpen
  );

  const isLogOnModalOpen = useSelector(
    (state: RootState) => state.reduser.isLogOnModalOpen
  );

  const { showEmoji } = useEmojiModal();

  async function fetchAccount(id: number | null) {
    if (!id) {
      dispatch(onSetLoading(false));
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/users/getUserById/${id}`
      );

      if (!response.ok) {
        dispatch(onSetLoading(false));
        showEmoji(":(", "red", "Couldn't connect you to your account");
        return;
      }

      const data = await response.json();

      dispatch(onSetUser(data));
      dispatch(onSetLanguage(data.language));
      dispatch(onSetUserStatus(true));
      dispatch(onSetLoading(false));
    } catch (err) {
      dispatch(onSetLoading(false));
      console.error(err);
    }
  }

  useEffect(() => {
    const initializeApp = async () => {
      const savedUserId = localStorage.getItem("userId");

      if (!savedUserId) {
        dispatch(onSetLoading(false));
        return;
      }

      const id = Number(savedUserId);

      dispatch(onSetUserId(id));

      await fetchAccount(id);
    };

    initializeApp();
  }, [dispatch]);

  useEffect(() => {
    connectSocket();

    return () => {
      disconnectSocket();
    };
  }, []);

  const handleModalClick1 = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      dispatch(onSetLogInModal());
    }
  };

  const handleModalClick2 = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      dispatch(onSetLogOnModal());
    }
  };

  const isWebsiteLoading = () => {
    if (loading) {
      return <Loading />;
    } else {
      return (
        <Router>
          <Routes>
            <Route
              path="/"
              element={
                <div className="app">
                  <div className="startPlace">
                    <Start />
                    {emojiModal.isOpen && (
                      <EmojiModal
                        emoji={emojiModal.emoji}
                        color={emojiModal.color}
                        text={emojiModal.text}
                      />
                    )}
                  </div>

                  {isLoginInModalOpen ? (
                    <div className="placeForModal" onClick={handleModalClick1}>
                      <LogIn />
                    </div>
                  ) : isLogOnModalOpen ? (
                    <div className="placeForModal" onClick={handleModalClick2}>
                      <LogOn />
                    </div>
                  ) : null}

                  <MainContent />
                </div>
              }
            />
            <Route path="/addChat" element={<AddChat />} />
          </Routes>
        </Router>
      );
    }
  };

  return <>{isWebsiteLoading()}</>;
};

export default App;
