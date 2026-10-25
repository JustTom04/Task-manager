import React, { useState, useEffect, useRef } from "react";
import { useClickOutside, useDropdownPosition, stopAnd } from "@/frontend/utils";
import { INPUT_LENGTH, DROPDOWN_OPTIONS } from "@/frontend/constants";
import LabelsPanel from "../LabelsPanel";
import CustomDropdown from "../CustomDropdown";
import TaskDescriptionInput from "../TopSectionComponents/TaskDescriptionInput";
import useStore, { FrontendTask } from "@/frontend/store/useStore";

interface TaskEditProps {
  task: FrontendTask;
  closeEdit: () => void;
  taskRef?: React.RefObject<HTMLDivElement | HTMLLIElement>;
  children?: React.ReactNode;
}

export default function TaskEdit({ task, closeEdit, taskRef, children }: TaskEditProps) {
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
  const [editedDescription, setEditedDescription] = useState(task.description || "");
  const [isLoadingDesc, setIsLoadingDesc] = useState(
    Boolean(task.hasDescription && task.description === undefined)
  );
  const [isMobileEdit, setIsMobileEdit] = useState(typeof window !== "undefined" ? window.innerWidth <= 450 : false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [showError, setShowError] = useState(false);

  const loadTaskDescription = useStore((s) => s.loadTaskDescription);

  const labelButtonRef = useRef<HTMLButtonElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const labelsPanelRef = useRef<HTMLDivElement>(null);
  const editContainerRef = useRef<HTMLDivElement>(null);
  const priorityDropdownRef = useRef<HTMLUListElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const dropdownPos = useDropdownPosition(labelButtonRef, labelsOpen, () => setLabelsOpen(false));

  useClickOutside([labelsRef, labelButtonRef, labelsPanelRef], () => setLabelsOpen(false));
  useClickOutside([editContainerRef, labelsRef, labelsPanelRef, priorityDropdownRef, taskRef], () => saveEdit());

  // Automatically focus task title input and place cursor at the end
  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
      const len = titleInputRef.current.value.length;
      titleInputRef.current.setSelectionRange(len, len);
    }
  }, []);

  // Lazy-load description if task hasDescription but text is not loaded yet
  useEffect(() => {
    if (task.hasDescription && task.description === undefined) {
      setIsLoadingDesc(true);
      loadTaskDescription(task.id)
        .then((desc) => {
          if (desc !== null) {
            setEditedDescription(desc);
          }
        })
        .finally(() => {
          setIsLoadingDesc(false);
        });
    }
  }, [task.id, task.hasDescription, task.description, loadTaskDescription, task.title]);

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
    if (!editedTitle.trim()) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }
    const trimmedDesc = editedDescription.trim();
    updateTask({
      title: editedTitle.trim(),
      priority: editedPriority,
      ...(isLoadingDesc ? {} : { description: trimmedDesc || null }),
    });
    closeEdit();
  };

  const cancelEdit = () => {
    closeEdit();
  };

  if (isMobileEdit) {
    if (task.title.length > Math.floor((window.innerWidth - 240) / 8)) {
      {/* ===== MOBILE LONG TITLE EDIT ===== */}
      return (
        <div className="task-edit-container" ref={editContainerRef}>
          <div className="edit-panel-mobile">
            <div className="mobile-top-row">
              <div className="labels-select" ref={labelsRef}>
                <button ref={labelButtonRef} type="button" className="labels-button" onClick={stopAnd(() => setLabelsOpen(prev => !prev))}>
                  Add label
                </button>
                {labelsOpen && <LabelsPanel ref={labelsPanelRef} labels={allLabels} selectedIds={task.labels} onToggle={toggleLabelOnTask} position={dropdownPos} />}
              </div>
              <input
                ref={titleInputRef}
                autoFocus
                type="text"
                className={showError ? "input-error shake-animation" : ""}
                placeholder={showError ? "Title cannot be empty!" : "Task title"}
                maxLength={INPUT_LENGTH.TASK_TITLE}
                value={editedTitle}
                onChange={(e) => {
                  setEditedTitle(e.target.value);
                  if (showError) setShowError(false);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); }}
                style={{ width: `${Math.max(showError ? 24 : 10, task.title.length + 2)}ch`, maxWidth: '100%' }}
              />
            </div>
            <div className="mobile-bottom-row">
              <CustomDropdown
                value={editedPriority}
                wrapperClass="priority-dropdown"
                onChange={setEditedPriority}
                options={DROPDOWN_OPTIONS.PRIORITY}
                portalRef={priorityDropdownRef}
              />
              <button className="task-button done" onClick={stopAnd(saveEdit)}>Save</button>
              <button className="task-button undone" onClick={stopAnd(cancelEdit)}>Cancel</button>
            </div>
          </div>

          {children}

          <TaskDescriptionInput
            isOpen={true}
            value={isLoadingDesc ? "" : editedDescription}
            onChange={setEditedDescription}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                saveEdit();
              }
            }}
            placeholder={isLoadingDesc ? "Loading description..." : "Add description (optional)..."}
            disabled={isLoadingDesc}
            className={`task-edit-description ${isLoadingDesc ? "loading" : ""}`}
            id={`edit-desc-${task.id}`}
          />
        </div>
      );
    } else {
      {/* ===== MOBILE SHORT TITLE EDIT ===== */}
      return (
        <div className="task-edit-container" ref={editContainerRef}>
          <div className="edit-panel-mobile">
            <div className="mobile-top-row">
              <div className="labels-select" ref={labelsRef}>
                <button ref={labelButtonRef} type="button" className="labels-button" onClick={stopAnd(() => setLabelsOpen(prev => !prev))}>
                  Add label
                </button>
                {labelsOpen && <LabelsPanel ref={labelsPanelRef} labels={allLabels} selectedIds={task.labels} onToggle={toggleLabelOnTask} position={dropdownPos} />}
              </div>
              <input
                ref={titleInputRef}
                autoFocus
                type="text"
                className={showError ? "input-error shake-animation" : ""}
                placeholder={showError ? "Title cannot be empty!" : "Task title"}
                maxLength={INPUT_LENGTH.TASK_TITLE}
                value={editedTitle}
                onChange={(e) => {
                  setEditedTitle(e.target.value);
                  if (showError) setShowError(false);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); }}
                style={{ width: `${Math.max(showError ? 24 : 10, task.title.length + 2)}ch`, maxWidth: '100%' }}
              />
              <CustomDropdown
                value={editedPriority}
                wrapperClass="priority-dropdown"
                onChange={setEditedPriority}
                options={DROPDOWN_OPTIONS.PRIORITY}
                portalRef={priorityDropdownRef}
              />
            </div>
            <div className="mobile-bottom-row">
              <button className="task-button done" onClick={stopAnd(saveEdit)}>Save</button>
              <button className="task-button undone" onClick={stopAnd(cancelEdit)}>Cancel</button>
            </div>
          </div>

          {children}

          <TaskDescriptionInput
            isOpen={true}
            value={isLoadingDesc ? "" : editedDescription}
            onChange={setEditedDescription}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                saveEdit();
              }
            }}
            placeholder={isLoadingDesc ? "Loading description..." : "Add description (optional)..."}
            disabled={isLoadingDesc}
            className={`task-edit-description ${isLoadingDesc ? "loading" : ""}`}
            id={`edit-desc-${task.id}`}
          />
        </div>
      );
    }
  }

  {/* ===== DESKTOP EDIT ===== */}
  return (
    <div className="task-edit-container" ref={editContainerRef}>
      <div className="edit-panel-desktop">
        <div className="desktop-left-group">
          <div className="labels-select" ref={labelsRef}>
            <button ref={labelButtonRef} type="button" className="labels-button" onClick={stopAnd(() => setLabelsOpen(prev => !prev))}>
              Add label
            </button>
            {labelsOpen && (
              <LabelsPanel
                ref={labelsPanelRef}
                labels={allLabels}
                selectedIds={task.labels}
                onToggle={toggleLabelOnTask}
                position={dropdownPos}
              />
            )}
          </div>
          <input
            ref={titleInputRef}
            autoFocus
            type="text"
            className={showError ? "input-error shake-animation" : ""}
            placeholder={showError ? "Title cannot be empty!" : "Task title"}
            maxLength={INPUT_LENGTH.TASK_TITLE}
            value={editedTitle}
            onChange={(e) => {
              setEditedTitle(e.target.value);
              if (showError) setShowError(false);
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); }}
            style={{ width: `${Math.max(showError ? 24 : 20, task.title.length + 2)}ch`, maxWidth: '100%' }}
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
            portalRef={priorityDropdownRef}
          />
          <button className="task-button done" onClick={stopAnd(saveEdit)}>Save</button>
          <button className="task-button undone" onClick={stopAnd(cancelEdit)}>Cancel</button>
        </div>
      </div>

      {children}

      <TaskDescriptionInput
        isOpen={true}
        value={isLoadingDesc ? "" : editedDescription}
        onChange={setEditedDescription}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            saveEdit();
          }
        }}
        placeholder={isLoadingDesc ? "Loading description..." : "Add description (optional)..."}
        disabled={isLoadingDesc}
        className={`task-edit-description ${isLoadingDesc ? "loading" : ""}`}
        id={`edit-desc-${task.id}`}
      />
    </div>
  );
}
