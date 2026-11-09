import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useClickOutside, useDropdownPosition, stopAnd } from "@/frontend/utils";
import "../styles/components/customDropdown.css";

interface Option {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  options?: Option[];
  value?: string;
  onChange?: (val: string) => void;
  customPanel?: (args: { close: () => void, ref: React.RefObject<HTMLUListElement | HTMLDivElement | null>, position: { top: number; left: number } | null }) => React.ReactNode;
  customTitle?: string | React.ReactNode;
  icon?: string;
  wrapperClass?: string;
  portalRef?: React.RefObject<HTMLUListElement | null>;
  ariaLabel?: string;
}

function CustomDropdown({ options, value, onChange, customPanel, customTitle, icon, wrapperClass, portalRef, ariaLabel }: CustomDropdownProps) {
  
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const internalDropdownRef = useRef(null);
  const dropdownRef = portalRef || internalDropdownRef;


  const selectedOption = options?.find(opt => opt.value === value);
  const displayTitle = customTitle ?? selectedOption?.label ?? "Select";
  const accessibleLabel = ariaLabel || (typeof displayTitle === "string" ? displayTitle : "Select option");

  useClickOutside([dropdownRef, wrapperRef], () => setOpen(false))

  const dropdownPos = useDropdownPosition(wrapperRef, open, () => setOpen(false));

  return (
    <div
      className={`select-wrapper ${open ? "open" : ""} ${icon ? "has-icon" : ""} ${wrapperClass || ""}`}
      ref={wrapperRef}
      role="button"
      tabIndex={0}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-label={accessibleLabel}
      onClick={(e) => setOpen(prev => !prev)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen(prev => !prev);
        } else if (e.key === "Escape" && open) {
          e.preventDefault();
          setOpen(false);
        } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          if (customPanel) {
            setOpen(true);
          } else if (options && options.length > 0 && onChange) {
            if (!open) {
              setOpen(true);
            }
            const currentIndex = options.findIndex(opt => opt.value === value);
            const nextIndex = e.key === "ArrowDown"
              ? (currentIndex < options.length - 1 ? currentIndex + 1 : 0)
              : (currentIndex > 0 ? currentIndex - 1 : options.length - 1);
            onChange(options[nextIndex].value);
          }
        }
      }}
    >
      <div className="filter-select">
        {icon && <span className={icon} aria-hidden="true"></span>}

        <span className="selected-text">
          {displayTitle}
        </span>

        <span className={`arrow ${open ? "open" : ""}`} aria-hidden="true"></span>
      </div>

      {open && (
        customPanel ? (
          // Custom panels might already be portaled or positioned by the caller
          customPanel({ close: () => { setOpen(false); wrapperRef.current?.focus(); }, ref: dropdownRef, position: dropdownPos })
        ) : (
          createPortal(
            <ul 
              className="dropdown-filter dropdown" 
              role="listbox"
              aria-label={accessibleLabel}
              ref={dropdownRef}
              style={{
                top: `${dropdownPos.top}px`,
                left: `${dropdownPos.left}px`,
                width: `${dropdownPos.width}px`,
                position: "absolute",
                margin: 0,
                marginTop: "4px"
              }}
            >
              {options.map((opt) => (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={opt.value === value}
                  className={opt.value === value ? "selected" : ""}
                  onClick={stopAnd(() => { onChange(opt.value); setOpen(false); })}
                >
                  {opt.label}
                </li>
              ))}
            </ul>,
            document.body
          )
        )
      )}
    </div>
  );
}

export default CustomDropdown;

