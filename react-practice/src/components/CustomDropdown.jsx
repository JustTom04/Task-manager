import { useState, useRef, useEffect } from "react";
import { useClickOutside, useDropdownPosition } from "@/utils";

function CustomDropdown({ options, value, onChange, customPanel, customTitle }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const selectedOption = options?.find(opt => opt.value === value);
  const displayTitle = customTitle ?? selectedOption?.label ?? "Select";

  useClickOutside(wrapperRef, () => setOpen(false))
 
  const dropdownPos = useDropdownPosition(wrapperRef, open);


  return (
    <div
      className={`select-wrapper ${open ? "open" : ""}`}
      ref={wrapperRef}
      onClick={() => setOpen(prev => !prev)}
    >
      <div className="filter-select">
        <span className="filter-icon"></span>

        <span className="selected-text">
          {displayTitle}
        </span>

        <span className={`arrow ${open ? "open" : ""}`}></span>
      </div>

      {open && (
        customPanel ? (
          customPanel({ close: () => setOpen(false), position: dropdownPos })
        ) : (
          <ul className="dropdown-filter dropdown">
            {options.map((opt) => (
              <li
                key={opt.value}
                className={opt.value === value ? "selected" : ""}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(opt.value);
                  setOpen(false);
                }}
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