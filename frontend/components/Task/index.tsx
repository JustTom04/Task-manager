import { useState, useEffect, forwardRef } from "react";
import { Reorder, useDragControls } from "framer-motion";

import { secondsToReadable, stopAnd } from "@/frontend/utils"
import Label from "../Label";
import TaskEdit from "./TaskEdit";

import useStore, { FrontendTask } from "@/frontend/store/useStore";

interface TaskProps {
  task: FrontendTask;
  onDragEnd?: () => void;
  isNew?: boolean;
  listRef?: React.RefObject<any>;
}

const Task = forwardRef<any, TaskProps>(({ task, onDragEnd, isNew, listRef }, ref) => {
  const dragControls = useDragControls();
  const _toggleTask = useStore(s => s.toggleTask);
  const _deleteTask = useStore(s => s.deleteTask);
  const _deleteTaskLabel = useStore(s => s.deleteTaskLabel);
  const draggingTaskId = useStore(s => s.draggingTaskId);

  const isDragging = draggingTaskId === task.id;

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
    <Reorder.Item
      id={`task-${task.id}`}
      value={task.id}
      dragListener={false} // Disable dragging on the whole item
      dragControls={dragControls}
      dragConstraints={listRef}
      onDragEnd={onDragEnd}
      initial={isNew ? { opacity: 0 } : false}
      animate={{ opacity: 1, scale: isDragging ? 1.01 : 1 }}
      transition={{ opacity: { duration: 0.2 }, scale: { duration: 0.15 } }}
      className={`task-item ${isEditing ? "active" : ""} ${task.done ? "done-overlay" : ""} ${isDeleting ? "deleting" : ""} ${isDragging ? "dragging" : ""}`}
      ref={ref}
      onClick={() => !isEditing && setIsEditing(true)}
    >
      {/* ===== Drag Handle ===== */}
      {!isEditing && (
        <div
          className="task-drag-handle"
          onPointerDown={(e) => {
            e.preventDefault(); // Critical to prevent selection and drag lock
            useStore.getState().setDraggingTaskId(task.id);
            dragControls.start(e);
            if (navigator.vibrate) {
              navigator.vibrate(50);
            }

            const handlePointerUp = () => {
              setTimeout(() => {
                const currentDragging = useStore.getState().draggingTaskId;
                if (currentDragging === task.id) {
                  useStore.getState().setDraggingTaskId(null);
                }
              }, 50);
              window.removeEventListener('pointerup', handlePointerUp);
            };
            window.addEventListener('pointerup', handlePointerUp);
          }}
          onClick={(e) => e.stopPropagation()} // Prevent opening edit mode
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M10 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM10 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM10 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM18 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM18 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM18 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
          </svg>
        </div>
      )}

      <div className="task-left-container">
        <div>
          {/* ===== EDIT MODE OR VIEW MODE ===== */}
          {isEditing ? (
            <TaskEdit task={task} closeEdit={() => setIsEditing(false)} />
          ) : (
            <>
              {/* ===== Checkbox ===== */}
              <button
                className={`task-button mark-btn ${task.done ? "completed" : ""}`}
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
    </Reorder.Item>
  );
});

export default Task;
