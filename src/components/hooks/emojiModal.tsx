import React from "react";
import './emojiModal.css';

interface EmojiModalProps {
    emoji: string;
    color: "red" | "green";
    text: string;
};

const EmojiModal: React.FC<EmojiModalProps> = ({emoji, color, text}): React.JSX.Element => {

    return (
        <div className="emojiModal">
        <div className={`emoji ${color}`}>
            {emoji}
        </div>             
            <p className="emojiText">{text}</p>   
        </div>
    )
}

export {EmojiModal};