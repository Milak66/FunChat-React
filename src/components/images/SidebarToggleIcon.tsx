import React from "react";

interface SidebarToggleIconProps {
  /** true = the chat list is visible, false = full chat screen */
  open: boolean;
  /** size in px (default 22) */
  size?: number;
}

/**
 * A window with a side panel and an arrow:
 *  - open   → panel filled in, arrow points left  ("hide the chat list")
 *  - closed → panel empty,     arrow points right ("show the chat list")
 *
 * It uses "currentColor", so it takes the text color of the button it's in.
 */
const SidebarToggleIcon: React.FC<SidebarToggleIconProps> = ({ open, size = 22 }) => {
  return (
    <svg
      className={`sidebarToggleIcon${open ? " open" : ""}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* the window */}
      <rect x="3" y="4" width="18" height="16" rx="3.5" />

      {/* the side panel (filled when the chat list is open) */}
      <path
        className="sidebarTogglePanel"
        d="M6.5 4h2.5v16H6.5A3.5 3.5 0 0 1 3 16.5v-9A3.5 3.5 0 0 1 6.5 4z"
        fill="currentColor"
        stroke="none"
      />
      <line x1="9" y1="4" x2="9" y2="20" />

      {/* the arrow */}
      <path className="sidebarToggleArrow" d="M14 9.5l2.5 2.5-2.5 2.5" />
    </svg>
  );
};

export default SidebarToggleIcon;