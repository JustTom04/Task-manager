import { useEffect, useState, RefObject } from "react";


// ===== Helpers =====
export const stopAnd = (fn: () => void) => (e: React.SyntheticEvent | Event) => {
  e.stopPropagation();
  fn();
};


export function getUserId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  let userId = localStorage.getItem('taskManager_userId');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('taskManager_userId', userId);
  }
  return userId;
}

export function secondsToReadable(seconds: number): string {
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

  return "0s";
}


// ===== Hooks =====
export function useClickOutside(refs: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[], onOutsideClick: () => void) {
  const refsArray = Array.isArray(refs) ? refs : [refs];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const isInside = refsArray.some(
        (ref) => ref.current && ref.current.contains(event.target as Node)
      );

      if (!isInside) {
        onOutsideClick();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [refsArray, onOutsideClick]);
}


export function useDropdownPosition(buttonRef: RefObject<HTMLElement | null>, labelsOpen: boolean) {
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


// Removed Constants -> moved to constants.ts