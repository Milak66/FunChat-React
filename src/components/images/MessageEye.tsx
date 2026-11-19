import React from "react";

/**
 * Shown on your own messages instead of check marks:
 *  - closed eye = sent, but not everyone in the chat has seen it yet
 *  - open eye   = everyone in the chat has seen it (it opens with a blink)
 * Uses "currentColor", so it takes the color of the time next to it.
 */
const MessageEye: React.FC<{ seen: boolean }> = ({ seen }) => (
  <span
    className={`messageEye${seen ? " seen" : ""}`}
    aria-label={seen ? "Seen" : "Sent"}
    title={seen ? "Seen" : "Sent"}
  >
    <svg viewBox="0 0 20 12" width="18" height="11" aria-hidden="true">
      {/* closed: the eyelid with three lashes */}
      <g className="messageEyeClosed">
        <path d="M2 4.5Q10 10.5 18 4.5" />
        <path d="M5.6 7.4L4.6 9.6" />
        <path d="M10 8.6V11" />
        <path d="M14.4 7.4L15.4 9.6" />
      </g>

      {/* open: the eye with its pupil */}
      <g className="messageEyeOpen">
        <path d="M1.8 6Q10 -1.4 18.2 6Q10 13.4 1.8 6Z" />
        <circle cx="10" cy="6" r="2.4" />
      </g>
    </svg>
  </span>
);

export default MessageEye;