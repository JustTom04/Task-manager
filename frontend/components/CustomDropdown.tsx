import { useState, useRef } from "react";
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
  customPanel?: (args: { close: () => void, ref: React.RefObject<HTMLUListElement | HTMLDivElement | null>, position: any }) => React.ReactNode;
  customTitle?: string | React.ReactNode;
  icon?: string;
  wrapperClass?: string;
}

function CustomDropdown({ options, value, onChange, customPanel, customTitle, icon, wrapperClass }: CustomDropdownProps) {
  
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const dropdownRef = useRef(null);


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
          customPanel({ close: () => setOpen(false), ref: dropdownRef, position: dropdownPos })
        ) : (
          <ul className="dropdown-filter dropdown">
            {options.map((opt) => (
              <li
                key={opt.value}
                className={opt.value === value ? "selected" : ""}
                onClick={stopAnd(() => { onChange(opt.value); setOpen(false); })}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}

export default CustomDropdown;

