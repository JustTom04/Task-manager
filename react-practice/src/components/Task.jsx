import { useState, useEffect, forwardRef } from "react";
import { secondsToReadable } from "@/utils.js"
import Label from "./Label.jsx";

const Task = forwardRef(({ task, toggleTask, deleteTask, updateTask, allLabels, deleteTaskLabel }, ref) => {
  const [seconds, setSeconds] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedPriority, setEditedPriority] = useState(task.priority);

  useEffect(() => {
    if (task.done) return;

    const savedSeconds = parseInt(localStorage.getItem(`task-${task.id}-seconds`) || "0");
    setSeconds(savedSeconds);

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
    <div className={`task-item ${isEditing ? "active" : ""}`} ref={ref}>
      <div className="task-left-container">
        <div>
          {/* ===== Editing mode ===== */}
          {isEditing ? (
            <div className="edit-panel">
              <input
                type="text"
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
              <button className="task-button done" onClick={saveEdit}>
                Save
              </button>
              <button className="task-button undone" onClick={cancelEdit}>
                Cancel
              </button>
            </div>
          ) : (
            <>
              {/* ===== Normal mode ===== */}
              <span
                className={`task-title ${task.done ? "finished" : ""}`}
                style={{ color }}
              >(
                {task.priority}) 
                { task.title} 
              </span>
              <span style={{ marginLeft: "10px", fontSize: "0.85rem", color: "white", whiteSpace: "nowrap" }} >
                ⏱ {secondsToReadable(seconds)}s
              </span>
            </>
          )}
        </div>

        {/* ===== Labels ===== */}
        <div className="task-labels">
          {allLabels
            .filter((label) => task.labels.includes(label.id))
            .map((label) => (
              <Label key={label.id} label={label} deleteLabel={() => deleteTaskLabel(task.id, label.id)}
              showDelete={isEditing}/>
            ))}
        </div>
      </div>

      {/* ===== Action buttons ===== */}
      {!isEditing && (
        <div className="task-actions">
          <div className="task-edit-buttons">
            <button
            className={`task-button ${task.done ? "done" : "undone"}`}
            onClick={toggleTask}
            >
              {task.done ? "Mark Undone" : "Mark Done"}
            </button>
            <button className="task-button undone" onClick={() => setIsEditing(true)}>
              Edit
            </button>
          </div>


          <button className="remove-button small" onClick={deleteTask}>
            ❌
          </button>
        </div>
      )}
    </div>
  );
});

export default Task;

