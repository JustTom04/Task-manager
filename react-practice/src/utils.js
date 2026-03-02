import { useEffect, useState } from "react";
import { createPortal, children } from "react-dom";


createPortal(children, document.getElementById("root"))


export function secondsToReadable(seconds) {
  const units = [
    { value: 86400, unit: "d" },  
    { value: 3600, unit: "h" },   
    { value: 60, unit: "m" },     
    { value: 1, unit: "s" },      
  ];

  for (let i = 0; i < units.length; i++) {
    if (seconds >= units[i].value) {
      const amount = Math.floor(seconds / units[i].value);
      return `${amount}${units[i].unit}`;
    }
  }

  return `0s`; 
}


export function useClickOutside(ref, onOutsideClick) {
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onOutsideClick();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, onOutsideClick]);
}



export function useDropdownPosition(buttonRef, labelsOpen) {
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (labelsOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  }, [labelsOpen, buttonRef]);

  return dropdownPos;
}



// ===== Input length limits =====
export const INPUT_LENGTH = {
  TASK_TITLE: 60,
  PROJECT_NAME: 60,
  LABEL_NAME: 40,
};
