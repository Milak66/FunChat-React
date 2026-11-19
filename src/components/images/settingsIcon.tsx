import React from "react";

interface SettingsIconProps {
  /** size in px (default 22) */
  size?: number;
}

/**
 * A gear: the settings button in the header.
 * Uses "currentColor", so it takes the color of its button.
 * It turns a little on hover (start.css: .settingsIconGear).
 */
const SettingsIcon: React.FC<SettingsIconProps> = ({ size = 22 }) => {
  return (
    <svg
      className="settingsIcon"
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
      <g className="settingsIconGear">
        {/* the gear with its 8 teeth, centered on (12, 12) like the hole */}
        <path d="M10.3 4.2a1.7 1.7 0 0 1 3.4 0 1.7 1.7 0 0 0 2.6 1.1 1.7 1.7 0 0 1 2.4 2.4 1.7 1.7 0 0 0 1.1 2.6 1.7 1.7 0 0 1 0 3.4 1.7 1.7 0 0 0-1.1 2.6 1.7 1.7 0 0 1-2.4 2.4 1.7 1.7 0 0 0-2.6 1.1 1.7 1.7 0 0 1-3.4 0 1.7 1.7 0 0 0-2.6-1.1 1.7 1.7 0 0 1-2.4-2.4 1.7 1.7 0 0 0-1.1-2.6 1.7 1.7 0 0 1 0-3.4 1.7 1.7 0 0 0 1.1-2.6 1.7 1.7 0 0 1 2.4-2.4 1.7 1.7 0 0 0 2.6-1.1z" />

        {/* the hole in the middle */}
        <circle cx="12" cy="12" r="3" />
      </g>
    </svg>
  );
};

export default SettingsIcon;