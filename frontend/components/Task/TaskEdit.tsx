import React, { useState, useEffect, useRef } from "react";
import { useClickOutside, useDropdownPosition, stopAnd } from "@/frontend/utils";
import { INPUT_LENGTH, DROPDOWN_OPTIONS } from "@/frontend/constants";
import LabelsPanel from "../LabelsPanel";
import CustomDropdown from "../CustomDropdown";
import useStore, { FrontendTask } from "@/frontend/store/useStore";

interface TaskEditProps {
  task: FrontendTask;
  closeEdit: () => void;
}

export default function TaskEdit({ task, closeEdit }: TaskEditProps) {
  const _updateTask = useStore(s => s.updateTask);
  const _toggleLabelOnTask = useStore(s => s.toggleLabelOnTask);
  
  const updateTask = (updated: Partial<FrontendTask>) => _updateTask(task.id, updated);
  const toggleLabelOnTask = (labelId: string) => _toggleLabelOnTask(task.id, labelId);

  const projects = useStore(s => s.projects);
  const activeProjectId = useStore(s => s.activeProjectId);
  const actualProject = projects.find(p => p.id === activeProjectId);
  const allLabels = actualProject?.labels || [];

  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedPriority, setEditedPriority] = useState(task.priority);
  const [isMobileEdit, setIsMobileEdit] = useState(window.innerWidth <= 450);
  const [labelsOpen, setLabelsOpen] = useState(false);

  const labelButtonRef = useRef<HTMLButtonElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const editContainerRef = useRef<HTMLDivElement>(null);

  const dropdownPos = useDropdownPosition(labelButtonRef, labelsOpen);

  useClickOutside([labelsRef, labelButtonRef], () => setLabelsOpen(false));
  useClickOutside([editContainerRef, labelsRef], () => closeEdit());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeEdit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    const handleResize = () => setIsMobileEdit(window.innerWidth <= 450);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    }
  }, [closeEdit]);

  const saveEdit = () => {
    if (!editedTitle.trim()) return;
    updateTask({ title: editedTitle, priority: editedPriority });
    closeEdit();
  };

  const cancelEdit = () => {
    closeEdit();
  };

  if (isMobileEdit) {
    if (task.title.length > Math.floor((window.innerWidth - 240) / 8)) {
      {/* ===== MOBILE LONG TITLE EDIT ===== */}
      return (
        <div className="edit-panel-mobile" ref={editContainerRef}>
          <div className="mobile-top-row">
            <div className="labels-select" ref={labelsRef}>
              <button ref={labelButtonRef} type="button" className="labels-button" onClick={stopAnd(() => setLabelsOpen(prev => !prev))}>
                Add label
              </button>
              {labelsOpen && <LabelsPanel labels={allLabels} selectedIds={task.labels} onToggle={toggleLabelOnTask} position={dropdownPos} />}
            </div>
            <input type="text" maxLength={INPUT_LENGTH.TASK_TITLE} value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); }} style={{ width: `${Math.max(10, task.title.length + 2)}ch`, maxWidth: '100%' }} />
          </div>
          <div className="mobile-bottom-row">
            <CustomDropdown
              value={editedPriority}
              wrapperClass="priority-dropdown"
              onChange={setEditedPriority}
              options={DROPDOWN_OPTIONS.PRIORITY}
            />
            <button className="task-button done" onClick={stopAnd(saveEdit)}>Save</button>
            <button className="task-button undone" onClick={stopAnd(cancelEdit)}>Cancel</button>
          </div>
        </div>
      );
    } else {
      {/* ===== MOBILE SHORT TITLE EDIT ===== */}
      return (
        <div className="edit-panel-mobile" ref={editContainerRef}>
          <div className="mobile-top-row">
            <div className="labels-select" ref={labelsRef}>
              <button ref={labelButtonRef} type="button" className="labels-button" onClick={stopAnd(() => setLabelsOpen(prev => !prev))}>
                Add label
              </button>
              {labelsOpen && <LabelsPanel labels={allLabels} selectedIds={task.labels} onToggle={toggleLabelOnTask} position={dropdownPos} />}
            </div>
            <input type="text" maxLength={INPUT_LENGTH.TASK_TITLE} value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); }} style={{ width: `${Math.max(10, task.title.length + 2)}ch`, maxWidth: '100%' }} />
            <CustomDropdown
              value={editedPriority}
              wrapperClass="priority-dropdown"
              onChange={setEditedPriority}
              options={DROPDOWN_OPTIONS.PRIORITY}
            />
          </div>
          <div className="mobile-bottom-row">
            <button className="task-button done" onClick={stopAnd(saveEdit)}>Save</button>
            <button className="task-button undone" onClick={stopAnd(cancelEdit)}>Cancel</button>
          </div>
        </div>
      );
    }
  }

  {/* ===== DESKTOP EDIT ===== */}
  return (
    <div className="edit-panel-desktop" ref={editContainerRef}>
      <div className="desktop-left-group">
        <div className="labels-select" ref={labelsRef}>
          <button ref={labelButtonRef} type="button" className="labels-button" onClick={stopAnd(() => setLabelsOpen(prev => !prev))}>
            Add label
          </button>
          {labelsOpen && (
            <LabelsPanel
              labels={allLabels}
              selectedIds={task.labels}
              onToggle={toggleLabelOnTask}
              position={dropdownPos}
            />
          )}
        </div>
        <input
          type="text"
          maxLength={INPUT_LENGTH.TASK_TITLE}
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); }}
          style={{ width: `${Math.max(20, task.title.length + 2)}ch`, maxWidth: '100%' }}
        />
      </div>
      <div className="desktop-right-group">
        <CustomDropdown
          value={editedPriority}
          wrapperClass="priority-dropdown"
          onChange={setEditedPriority}
          options={[
            { value: "high", label: "High" },
            { value: "mid", label: "Mid" },
            { value: "low", label: "Low" }
          ]}
        />
        <button className="task-button done" onClick={stopAnd(saveEdit)}>Save</button>
        <button className="task-button undone" onClick={stopAnd(cancelEdit)}>Cancel</button>
      </div>
    </div>
  );
}
