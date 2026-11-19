import React from "react";

interface LanguageIconProps {
  /** size in px (default 22) */
  size?: number;
}

/**
 * A globe: the "change language" button in the header.
 * Uses "currentColor", so it takes the text color of its button
 * (white on the purple header). Its lines spin a little on hover (start.css).
 */
const LanguageIcon: React.FC<LanguageIconProps> = ({ size = 22 }) => {
  return (
    <svg
      className="languageIcon"
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
      {/* the globe */}
      <circle cx="12" cy="12" r="9" />

      {/* longitude lines (these turn on hover) */}
      <g className="languageIconMeridians">
        <ellipse cx="12" cy="12" rx="3.8" ry="9" />
      </g>

      {/* equator and two latitude lines */}
      <path d="M3 12h18" />
      <path d="M4.6 7.5h14.8" />
      <path d="M4.6 16.5h14.8" />
    </svg>
  );
};

export default LanguageIcon;