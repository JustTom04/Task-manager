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
}

function CustomDropdown({ options, value, onChange, customPanel, customTitle, icon, wrapperClass, portalRef }: CustomDropdownProps) {
  
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const internalDropdownRef = useRef(null);
  const dropdownRef = portalRef || internalDropdownRef;


  const selectedOption = options?.find(opt => opt.value === value);
  const displayTitle = customTitle ?? selectedOption?.label ?? "Select";

  useClickOutside([dropdownRef, wrapperRef], () => setOpen(false))

  const dropdownPos = useDropdownPosition(wrapperRef, open);

  return (
    <div
      className={`select-wrapper ${open ? "open" : ""} ${icon ? "has-icon" : ""} ${wrapperClass || ""}`}
      ref={wrapperRef}
      onClick={(e) =>  setOpen(prev => !prev)}
    >
      <div className="filter-select">
        {icon && <span className={icon}></span>}

        <span className="selected-text">
          {displayTitle}
        </span>

        <span className={`arrow ${open ? "open" : ""}`}></span>
      </div>

      {open && (
        customPanel ? (
          // Custom panels might already be portaled or positioned by the caller
          customPanel({ close: () => setOpen(false), ref: dropdownRef, position: dropdownPos })
        ) : (
          createPortal(
            <ul 
              className="dropdown-filter dropdown" 
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

