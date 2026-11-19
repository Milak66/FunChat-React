import React from "react";

interface TrashIconProps {
  /** size in px (default 22) */
  size?: number;
}

/**
 * A trash can for "delete chat".
 * Uses "currentColor", so it takes the text color of its button.
 * The lid lifts on hover (chat.css: .trashIconLid).
 */
const TrashIcon: React.FC<TrashIconProps> = ({ size = 22 }) => {
  return (
    <svg
      className="trashIcon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* the lid with its handle */}
      <g className="trashIconLid">
        <path d="M4 7h16" />
        <path d="M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7" />
      </g>

      {/* the can */}
      <path d="M6 7l.9 11.6A2.2 2.2 0 0 0 9.1 20.6h5.8a2.2 2.2 0 0 0 2.2-2l.9-11.6" />

      {/* stripes */}
      <path d="M10 11v5.5" />
      <path d="M14 11v5.5" />
    </svg>
  );
};

export default TrashIcon;