import { useState, useEffect, forwardRef, useRef } from "react";
import { secondsToReadable, useClickOutside, useDropdownPosition, stopAnd, INPUT_LENGTH } from "@/utils.js"
import Label from "./Label.jsx";
import LabelsPanel from "./LabelsPanel.jsx";

const Task = forwardRef(({ task, toggleTask, deleteTask, updateTask, allLabels, deleteTaskLabel, toggleLabelOnTask }, ref) => {
  const [seconds, setSeconds] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedPriority, setEditedPriority] = useState(task.priority);


  // ===== Handle labels ===== 
  const labelButtonRef = useRef(null);
  const labelsRef = useRef(null);
  const [labelsOpen, setLabelsOpen] = useState(false);

  const dropdownPos = useDropdownPosition(labelButtonRef, labelsOpen);
  useClickOutside([labelsRef, labelButtonRef], () => setLabelsOpen(false));


  const localRef = useRef(null);
  useClickOutside([localRef, labelsRef], () => {
    setIsEditing(false);
  });


  // ===== Handle timer =====
  useEffect(() => {
    const savedSeconds = parseInt(localStorage.getItem(`task-${task.id}-seconds`) || "0");
    setSeconds(savedSeconds);

    if (task.done) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        const newVal = prev + 1;
        localStorage.setItem(`task-${task.id}-seconds`, newVal);
        return newVal;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [task.done, task.id]);

  
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

  let color;
  switch (task.priority) {
    case "high":
      color = "red";
      break;
    case "mid":
      color = "orange";
      break;
    default:
      color = "green";
  }

  return (
    <div
    className={`task-item ${isEditing ? "active" : ""} ${task.done ? "done-overlay" : ""}`}
    ref={(node) => {
      localRef.current = node;
      if (ref) ref.current = node; 
    }}
    onClick={() => setIsEditing(true)} 
    >
      <div className="task-left-container">
        <div>
          {isEditing ? (
            <div className="edit-panel">
              <div className="edit-top-row">
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
                />
                <select
                  value={editedPriority}
                  onChange={(e) => setEditedPriority(e.target.value)}
                >
                  <option value="high">High</option>
                  <option value="mid">Mid</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              <div className="edit-bottom-row">
                <button
                  className="task-button done"
                  onClick={stopAnd(saveEdit)}
                >
                  Save
                </button>
                <button
                  className="task-button undone"
                  onClick={stopAnd(cancelEdit)}
                >
                  Cancel
              </button>
              </div>
            </div>
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
          <div className="task-edit-buttons">
          </div>
          <button
            className="remove-button medium"
            onClick={stopAnd(deleteTask)}
          >
            ❌
          </button>
        </div>
      )}
    </div>
  );
});

export default Task;

