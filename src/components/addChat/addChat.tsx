import React, { useState, useEffect } from "react";
import "./addChat.css";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import { onSetUserChats } from "../reduser/reduser";
import MiniLoading from "../miniLoading/miniLoadin";

interface AddChatProps {};

interface AtUser {
    id: number;
    username: string;
}

const AddChat: React.FC<AddChatProps> = () => {
  const [atUsername, setAtUsername] = useState<string>("");
  const [atUsernames, setAtUsernames] = useState<AtUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const texts = useSelector(
    (state: RootState) => state.reduser.texts
  );

  const userId = useSelector(
    (state: RootState) => state.reduser.userId
  );

  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {

    if (atUsername.trim() === "") {
      setAtUsernames([]);
    setIsLoading(false);
      return;
    }

    const findUsers = async () => {
    setIsLoading(true);
    
      try {

        const response = await fetch(
        `http://localhost:8888/users/getUsersByUsername/${userId}?username=${encodeURIComponent(atUsername)}`
        );

        if (!response.ok) {
          console.error("Couldn't find users");
          return;
        }

        const users = await response.json();

        setAtUsernames(users);
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setIsLoading(false);
      }
    };

    findUsers();

  }, [atUsername]);

  const createChat = async (otherUserId: number) => {
    try {
      const response = await fetch(
        `http://localhost:8888/chats/createChat/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(otherUserId),
      });

      if (!response.ok) {
        console.error("Couldn't create a chat");
        return;
      }

      const chatId = await response.json();

      dispatch(onSetUserChats(chatId));

    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  }

  const returnAtUsernames = () => {
    return (
        <>
        {atUsernames.map((user) => (
        <div className="atUsername" key={user.id} onClick={() => createChat(user.id)}>
        @{user.username}
        </div>
    ))}
    </>
)
  }

  return (
    <div className="addChat">
        <div className="findUserDiv">
            <div className="findUserText">{texts.findByUsernameText}</div>
            <input 
            className="findUserInput" 
            type="text" 
            placeholder={texts.inputText}
            value={atUsername}
            onChange={(e) => setAtUsername(e.target.value)}
            />
        </div>

        {isLoading ? <div className="addChatLoading"><MiniLoading /></div> 
        : <div className="atUsernames">{returnAtUsernames()}</div>}
    </div>
  );
};

export default AddChat;