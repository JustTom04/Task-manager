import React, { useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useStore from "@/frontend/store/useStore";
import { INPUT_LENGTH } from "@/frontend/constants";

interface TaskDescriptionInputProps {
  isOpen: boolean;
  value?: string;
  onChange?: (val: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  id?: string;
}

const MAX_DESCRIPTION_HEIGHT = 200;

export default function TaskDescriptionInput({
  isOpen,
  value: propValue,
  onChange: propOnChange,
  onKeyDown,
  placeholder = "Add description (optional)...",
  className = "top-section-description",
  autoFocus = false,
  disabled = false,
  id,
}: TaskDescriptionInputProps) {
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const storeDescription = useStore((s) => s.newDescription);
  const setStoreDescription = useStore((s) => s.setNewDescription);

  const value = propValue !== undefined ? propValue : storeDescription;
  const onChange = propOnChange || setStoreDescription;
  const isTopSection = className === "top-section-description";

  // Auto-grow textarea up to max height
  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_DESCRIPTION_HEIGHT)}px`;
  }, [value, isOpen]);

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="task-description-input"
          className={className}
          initial={{ height: 0, opacity: 0, marginBottom: 0 }}
          animate={{ height: "auto", opacity: 1, marginBottom: isTopSection ? 6 : 0 }}
          exit={{ height: 0, opacity: 0, marginBottom: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <textarea
            id={id || "task-description-input"}
            ref={descriptionRef}
            className="description-input"
            rows={2}
            maxLength={INPUT_LENGTH.TASK_DESCRIPTION}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            autoFocus={autoFocus}
            disabled={disabled}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
