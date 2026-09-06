import { useState, useEffect, forwardRef, useRef } from "react";

import { secondsToReadable, useClickOutside, useDropdownPosition, stopAnd, INPUT_LENGTH } from "@/frontend/utils"
import Label from "./Label";
import LabelsPanel from "./LabelsPanel";
import CustomDropdown from "./CustomDropdown";

import useStore, { FrontendTask } from "@/frontend/store/useStore";

interface TaskProps {
  task: FrontendTask;
}

const Task = forwardRef<HTMLDivElement, TaskProps>(({ task }, ref) => {
  const _toggleTask = useStore(s => s.toggleTask);
  const _deleteTask = useStore(s => s.deleteTask);
  const _updateTask = useStore(s => s.updateTask);
  const _deleteTaskLabel = useStore(s => s.deleteTaskLabel);
  const _toggleLabelOnTask = useStore(s => s.toggleLabelOnTask);
  
  const toggleTask = () => _toggleTask(task.id);
  const deleteTask = () => _deleteTask(task.id);
  const updateTask = (updated: Partial<FrontendTask>) => _updateTask(task.id, updated);
  const deleteTaskLabel = (taskId: string, labelId: string) => _deleteTaskLabel(taskId, labelId);
  const toggleLabelOnTask = (taskId: string, labelId: string) => _toggleLabelOnTask(taskId, labelId);

  const projects = useStore(s => s.projects);
  const activeProjectId = useStore(s => s.activeProjectId);
  const actualProject = projects.find(p => p.id === activeProjectId);
  const allLabels = actualProject?.labels || [];

  // ===== States =====
  const [seconds, setSeconds] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedPriority, setEditedPriority] = useState(task.priority);
  const [isMobileEdit, setIsMobileEdit] = useState(window.innerWidth <= 450);


  // ===== Handle labels ===== 
  const labelButtonRef = useRef(null);
  const labelsRef = useRef(null);
  const [labelsOpen, setLabelsOpen] = useState(false);

  const dropdownPos = useDropdownPosition(labelButtonRef, labelsOpen);
  useClickOutside([labelsRef, labelButtonRef], () => setLabelsOpen(false));

  // ===== Editing =====
  const localRef = useRef(null);
  useClickOutside([localRef, labelsRef], () => {
    setIsEditing(false);
  });

  useEffect(() => {
    if (!isEditing) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditedTitle(task.title);
        setEditedPriority(task.priority);
        setIsEditing(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    const handleResize = () => setIsMobileEdit(window.innerWidth <= 450);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    }
  }, [isEditing, task.title, task.priority]);


  // ===== Handle timer =====
  useEffect(() => {
    const savedSeconds = parseInt(localStorage.getItem(`task-${task.id}-seconds`) || "0");
    setSeconds(savedSeconds);

    if (task.done) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        const newVal = prev + 1;
        localStorage.setItem(`task-${task.id}-seconds`, newVal.toString());
        return newVal;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [task.done, task.id]);

  // ===== Functions =====
  const saveEdit = () => {
    if (!editedTitle.trim()) return;
    updateTask({ title: editedTitle, priority: editedPriority });
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditedTitle(task.title);
    setEditedPriority(task.priority);
    setIsEditing(false);
  };


  const colorMap: Record<string, string> = { high: "red", mid: "orange", low: "green" };
  const color = colorMap[task.priority] || "green";

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      deleteTask();
    }, 380); // Wait for CSS animation
  };

  // ===== Return JSX =====
  return (
    <div
    className={`task-item ${isEditing ? "active" : ""} ${task.done ? "done-overlay" : ""} ${isDeleting ? "deleting" : ""}`}
    ref={(node) => {
      (localRef as any).current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }}
    onClick={() => setIsEditing(true)} 
    >
      <div className="task-left-container">
        <div>
          {isEditing ? (
            isMobileEdit ? (
              (task.title.length > Math.floor((window.innerWidth - 240) / 8)) ? (
                /* Mobile Edit Panel - Long Name */
                <div className="edit-panel-mobile">
                  <div className="mobile-top-row">
                    <div className="labels-select">
                      <button ref={labelButtonRef} type="button" className="labels-button" onClick={stopAnd(() => setLabelsOpen(prev => !prev)) }>
                        Add label
                      </button>
                      {labelsOpen && <LabelsPanel labels={allLabels} selectedIds={task.labels} onToggle={(labelId) => toggleLabelOnTask(task.id, labelId)} position={dropdownPos} ref={labelsRef} />}
                    </div>
                    <input type="text" maxLength={INPUT_LENGTH.TASK_TITLE} value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); }} style={{ width: `${Math.max(10, task.title.length + 2)}ch`, maxWidth: '100%' }} />
                  </div>
                  
                  <div className="mobile-bottom-row">
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
              ) : (
                /* Mobile Edit Panel - Short Name */
                <div className="edit-panel-mobile">
                  <div className="mobile-top-row">
                    <div className="labels-select">
                      <button ref={labelButtonRef} type="button" className="labels-button" onClick={stopAnd(() => setLabelsOpen(prev => !prev)) }>
                        Add label
                      </button>
                      {labelsOpen && <LabelsPanel labels={allLabels} selectedIds={task.labels} onToggle={(labelId) => toggleLabelOnTask(task.id, labelId)} position={dropdownPos} ref={labelsRef} />}
                    </div>
                    <input type="text" maxLength={INPUT_LENGTH.TASK_TITLE} value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); }} style={{ width: `${Math.max(10, task.title.length + 2)}ch`, maxWidth: '100%' }} />
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
                  </div>
                  
                  <div className="mobile-bottom-row">
                    <button className="task-button done" onClick={stopAnd(saveEdit)}>Save</button>
                    <button className="task-button undone" onClick={stopAnd(cancelEdit)}>Cancel</button>
                  </div>
                </div>
              )
            ) : (
              /* Desktop Edit Panel */
              <div className="edit-panel-desktop">
                <div className="desktop-left-group">
                  <div className="labels-select">
                    <button
                      ref={labelButtonRef}
                      type="button"
                      className="labels-button"
                      onClick={stopAnd(() => setLabelsOpen(prev => !prev)) }
                    >
                      Add label
                    </button>
                    {labelsOpen && (
                      <LabelsPanel
                        labels={allLabels}
                        selectedIds={task.labels}
                        onToggle={(labelId) => toggleLabelOnTask(task.id, labelId)}
                        position={dropdownPos}
                        ref={labelsRef}
                      />
                    )}
                  </div>

                  <input
                    type="text"
                    maxLength={INPUT_LENGTH.TASK_TITLE}
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit();
                    }}
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
            )
          ) : (
            <>
              <button
                className={`task-button mark-btn ${task.done ? "completed": ""}`}
                onClick={stopAnd(toggleTask)}
              >
                ✓ {task.done ? "Completed" : "Mark complete"}
              </button>
              <span>&nbsp;&nbsp;</span>
              <span className={`task-title ${task.done ? "finished" : ""}`}>
                <span style={{ color }}>
                  {`(${task.priority}) `}
                </span>
                {`${task.title}`}
              </span>
              <span
                style={{
                  marginLeft: "10px",
                  fontSize: "0.85rem",
                  color: "white",
                  whiteSpace: "nowrap",
                }}
              >
                ⏱ {secondsToReadable(seconds)}
              </span>
            </>
          )}
        </div>

        <div className="task-labels">
          {allLabels
            .filter((label) => task.labels.includes(label.id))
            .map((label) => (
              <Label
                key={label.id}
                label={label}
                deleteLabel={() => deleteTaskLabel(task.id, label.id)}
                showDelete={isEditing}
              />
            ))}
        </div>
      </div>

      {!isEditing && (
        <div className="task-actions">
          <button
            className="remove-button medium"
            onClick={stopAnd(handleDelete)}
          >
            ❌
          </button>
        </div>
      )}
    </div>
  );
});

export default Task;

