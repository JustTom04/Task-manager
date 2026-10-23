import React, { useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useStore from "@/frontend/store/useStore";
import { INPUT_LENGTH } from "@/frontend/constants";

interface TaskDescriptionInputProps {
  isOpen: boolean;
}

const MAX_DESCRIPTION_HEIGHT = 200;

export default function TaskDescriptionInput({ isOpen }: TaskDescriptionInputProps) {
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const newDescription = useStore((s) => s.newDescription);
  const setNewDescription = useStore((s) => s.setNewDescription);

  // Auto-grow textarea up to max height
  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_DESCRIPTION_HEIGHT)}px`;
  }, [newDescription, isOpen]);

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="top-task-description"
          className="top-section-description"
          initial={{ height: 0, opacity: 0, marginBottom: 0 }}
          animate={{ height: "auto", opacity: 1, marginBottom: 10 }}
          exit={{ height: 0, opacity: 0, marginBottom: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <textarea
            id="new-task-description"
            ref={descriptionRef}
            className="description-input"
            rows={3}
            maxLength={INPUT_LENGTH.TASK_DESCRIPTION}
            placeholder="Add description (optional)..."
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            autoFocus
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
