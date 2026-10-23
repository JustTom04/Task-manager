import React, { useRef, useState } from "react";
import CustomDropdown from "../CustomDropdown";
import useStore from "@/frontend/store/useStore";
import { INPUT_LENGTH, DROPDOWN_OPTIONS } from "@/frontend/constants";

interface AddTaskFormProps {
  isMobile?: boolean;
  children?: React.ReactNode;
  isDescriptionOpen: boolean;
  setIsDescriptionOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export default function AddTaskForm({
  isMobile,
  children,
  isDescriptionOpen,
  setIsDescriptionOpen,
}: AddTaskFormProps) {
  const newTitleRef = useRef<HTMLInputElement>(null);
  const newTitle = useStore((s) => s.newTitle);
  const setNewTitle = useStore((s) => s.setNewTitle);
  const newDescription = useStore((s) => s.newDescription);
  const newPriority = useStore((s) => s.newPriority);
  const setNewPriority = useStore((s) => s.setNewPriority);
  const selectedLabels = useStore((s) => s.selectedLabels);
  const _addTask = useStore((s) => s.addTask);

  const [showError, setShowError] = useState(false);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }
    _addTask(newTitle, newPriority, selectedLabels, newDescription);
    setShowError(false);
    // Collapse back to the compact bar, unless the store refused the task and kept the text
    if (!useStore.getState().newDescription) {
      setIsDescriptionOpen(false);
    }
  };

  return (
    <form onSubmit={addTask} className="section form-container">
      {children}

      <input
        type="text"
        className={showError ? "input-error shake-animation" : ""}
        maxLength={INPUT_LENGTH.TASK_TITLE}
        placeholder={showError ? "Title cannot be empty!" : "Task title"}
        value={newTitle}
        onChange={(e) => {
          setNewTitle(e.target.value);
          if (showError) setShowError(false);
        }}
        ref={newTitleRef}
      />

      <CustomDropdown
        value={newPriority}
        wrapperClass={isMobile ? "add-task-selection" : "priority-dropdown"}
        onChange={setNewPriority}
        options={DROPDOWN_OPTIONS.PRIORITY}
      />

      <button
        type="button"
        id="toggle-description-button"
        className={`notes-toggle ${isDescriptionOpen || newDescription ? "active" : ""}`}
        aria-expanded={isDescriptionOpen}
        onClick={() => setIsDescriptionOpen((open) => !open)}
      >
        📝 Notes
      </button>

      <button type="submit" className="task-button done">
        Add task
      </button>
    </form>
  );
}
