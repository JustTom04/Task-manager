import React, { forwardRef } from "react";

export interface RemoveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "medium" | "small";
}

const RemoveButton = forwardRef<HTMLButtonElement, RemoveButtonProps>(({
  size = "medium",
  className = "",
  type = "button",
  ...props
}, ref) => {
  const iconSize = size === "small" ? 13 : 18;

  return (
    <button
      ref={ref}
      type={type}
      className={`action-button remove-button ${size} ${className}`.trim()}
      {...props}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="2.5" y1="2.5" x2="13.5" y2="13.5" />
        <line x1="13.5" y1="2.5" x2="2.5" y2="13.5" />
      </svg>
    </button>
  );
});

RemoveButton.displayName = "RemoveButton";

export default RemoveButton;
