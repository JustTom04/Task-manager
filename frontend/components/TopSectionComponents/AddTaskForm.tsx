import React, { useRef } from "react";
import CustomDropdown from "../CustomDropdown";
import useStore from "@/frontend/store/useStore";
import { INPUT_LENGTH, DROPDOWN_OPTIONS } from "@/frontend/constants";

interface AddTaskFormProps {
  isMobile?: boolean;
  children?: React.ReactNode;
}

export default function AddTaskForm({ isMobile, children }: AddTaskFormProps) {
  const newTitleRef = useRef<HTMLInputElement>(null);
  const newTitle = useStore((s) => s.newTitle);
  const setNewTitle = useStore((s) => s.setNewTitle);
  const newPriority = useStore((s) => s.newPriority);
  const setNewPriority = useStore((s) => s.setNewPriority);
  const selectedLabels = useStore((s) => s.selectedLabels);
  const _addTask = useStore((s) => s.addTask);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    _addTask(newTitle, newPriority, selectedLabels);
  };

  return (
    <form onSubmit={addTask} className="section form-container">
      {children}

      <input
        type="text"
        maxLength={INPUT_LENGTH.TASK_TITLE}
        placeholder="Task title"
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        ref={newTitleRef}
      />

      <CustomDropdown
        value={newPriority}
        wrapperClass={isMobile ? "add-task-selection" : "priority-dropdown"}
        onChange={setNewPriority}
        options={DROPDOWN_OPTIONS.PRIORITY}
      />

      <button type="submit" className="task-button done">
        Add task
      </button>
    </form>
  );
}
