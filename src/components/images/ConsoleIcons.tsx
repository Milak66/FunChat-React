/**
 * Icons for the FunChat console (bottom of the chat list).
 * They use "currentColor", so they take the color of their button.
 */

const iconProps = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  
  /** a little terminal window: ">_" */
  export const ConsoleIcon = () => (
    <svg {...iconProps}>
      <rect x="3" y="4.5" width="18" height="15" rx="3.5" />
      <path d="M7.5 10l2.5 2-2.5 2" />
      <path d="M12.5 14.5h4" />
    </svg>
  );
  
  /** a broom-like "clear" icon: lines with an x */
  export const ClearIcon = () => (
    <svg {...iconProps}>
      <path d="M4 7h10" />
      <path d="M4 12h7" />
      <path d="M4 17h5" />
      <path d="M15 13l5 5M20 13l-5 5" />
    </svg>
  );
  
  /** arrow up / down (rotated with CSS when the console is open) */
  export const ChevronIcon = () => (
    <svg {...iconProps}>
      <path d="M6 15l6-6 6 6" />
    </svg>
  );
  
  export const CloseIcon = () => (
    <svg {...iconProps}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );