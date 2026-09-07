import { useState, useEffect, forwardRef } from "react";

import { secondsToReadable, stopAnd } from "@/frontend/utils"
import Label from "../Label";
import TaskEdit from "./TaskEdit";

import useStore, { FrontendTask } from "@/frontend/store/useStore";

interface TaskProps {
  task: FrontendTask;
}

const Task = forwardRef<HTMLDivElement, TaskProps>(({ task }, ref) => {
  const _toggleTask = useStore(s => s.toggleTask);
  const _deleteTask = useStore(s => s.deleteTask);
  const _deleteTaskLabel = useStore(s => s.deleteTaskLabel);
  
  const toggleTask = () => _toggleTask(task.id);
  const deleteTask = () => _deleteTask(task.id);
  const deleteTaskLabel = (taskId: string, labelId: string) => _deleteTaskLabel(taskId, labelId);

  const projects = useStore(s => s.projects);
  const activeProjectId = useStore(s => s.activeProjectId);
  const actualProject = projects.find(p => p.id === activeProjectId);
  const allLabels = actualProject?.labels || [];

  // ===== States =====
  const [seconds, setSeconds] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ===== Handle timer =====
  useEffect(() => {
    let savedSeconds = parseInt(localStorage.getItem(`task-${task.id}-seconds`) || "0");
    const lastTick = parseInt(localStorage.getItem(`task-${task.id}-last-tick`) || "0");

    // Reconcile elapsed time if the task was tracking in the background
    if (!task.done && lastTick > 0) {
      const passedSeconds = Math.floor((Date.now() - lastTick) / 1000);
      if (passedSeconds > 0) {
        savedSeconds += passedSeconds;
        localStorage.setItem(`task-${task.id}-seconds`, savedSeconds.toString());
      }
    }
    
    setSeconds(savedSeconds);

    if (task.done) {
      // Clear the tracking anchor to prevent time jumps if the task is unmarked later
      localStorage.removeItem(`task-${task.id}-last-tick`);
      return;
    }

    localStorage.setItem(`task-${task.id}-last-tick`, Date.now().toString());

    const interval = setInterval(() => {
      setSeconds((prev) => {
        const newVal = prev + 1;
        localStorage.setItem(`task-${task.id}-seconds`, newVal.toString());
        localStorage.setItem(`task-${task.id}-last-tick`, Date.now().toString());
        return newVal;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [task.done, task.id]);

  // ===== Functions =====
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
      ref={ref}
      onClick={() => !isEditing && setIsEditing(true)} 
    >
      <div className="task-left-container">
        <div>
          {/* ===== EDIT MODE OR VIEW MODE ===== */}
          {isEditing ? (
            <TaskEdit task={task} closeEdit={() => setIsEditing(false)} />
          ) : (
            <>
              {/* ===== Checkbox ===== */}
              <button
                className={`task-button mark-btn ${task.done ? "completed": ""}`}
                onClick={stopAnd(toggleTask)}
              >
                ✓ {task.done ? "Completed" : "Mark complete"}
              </button>
              <span>&nbsp;&nbsp;</span>

              {/* ===== Task title with priority ===== */}
              <span className={`task-title ${task.done ? "finished" : ""}`}>
                <span style={{ color }}>
                  {`(${task.priority}) `}
                </span>
                {`${task.title}`}
              </span>

              {/* ===== Timer ===== */}
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

        {/* ===== Labels Container ===== */}
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

      {/* ===== Action Buttons (Delete) ===== */}
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
