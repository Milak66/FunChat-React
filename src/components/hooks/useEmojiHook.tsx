import { useDispatch } from "react-redux";
import { AppDispatch } from "../store/store";
import { showEmojiModal, hideEmojiModal } from "../reduser/reduser";

export const useEmojiModal = () => {
  const dispatch = useDispatch<AppDispatch>();

  const showEmoji = (emoji: string, color: "red" | "green", text: string) => {
    dispatch(showEmojiModal({ emoji, color, text }));

    setTimeout(() => {
      dispatch(hideEmojiModal());
    }, 5000);
  };

  return { showEmoji };
};
