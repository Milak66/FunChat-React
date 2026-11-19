/**
 * Small icons for the message menu (right click / long press on a message).
 * They use "currentColor", so they take the color of the option they're in.
 */

const iconProps = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  
  export const CopyIcon = () => (
    <svg {...iconProps}>
      <rect x="9" y="9" width="11" height="11" rx="3" />
      <path d="M5 15V6a2 2 0 0 1 2-2h8" />
    </svg>
  );
  
  /** a curved arrow pointing back, like Telegram's "Reply" */
  export const ReplyIcon = () => (
    <svg {...iconProps}>
      <path d="M10 5L4 11l6 6" />
      <path d="M4 11h9a7 7 0 0 1 7 7v1" />
    </svg>
  );
  
  export const EditIcon = () => (
    <svg {...iconProps}>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
  
  export const TrashIcon = () => (
    <svg {...iconProps}>
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
  
  export const ClockIcon = () => (
    <svg {...iconProps} width={14} height={14}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );