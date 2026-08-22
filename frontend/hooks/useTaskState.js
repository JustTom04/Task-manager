import { INPUT_LENGTH } from "../utils";
import { useState, useEffect, useRef, useCallback } from "react";

// --- NEXT.JS SERVER ACTIONS IMPORT ---
import { createTask, updateTask as updateTaskAction, deleteTask as deleteTaskAction, deleteAllTasks as deleteAllTasksAction } from "@/backend/actions/taskActions";

export function useTaskState({ actualTasksList, activeProjectId, setProjects, activeUserId }) {
  // ===== States =====
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("mid");
  const [selectedLabels, setSelectedLabels] = useState([]);

  // ===== Refs =====
  const newTitleRef = useRef(null);
  const lastTaskRef = useRef(null);

  const [shouldScroll, setShouldScroll] = useState(false);

  // ===== Scroll to last task =====
  useEffect(() => {
    if (shouldScroll && lastTaskRef.current) {
      lastTaskRef.current.scrollIntoView({ behavior: "smooth" });
      setShouldScroll(false);
    }
  }, [actualTasksList, shouldScroll]);

  // ===== Task functions =====
  const addTask = useCallback((e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (newTitle.length > INPUT_LENGTH.TASK_TITLE) return;

    const newTask = {
      id: crypto.randomUUID(),
      title: newTitle,
      done: false,
      priority: newPriority,
      labels: selectedLabels,
      projectId: activeProjectId,
      projectIds: [activeProjectId],
    };

    // --- SERVER ACTION MIRRORING ---
    createTask(newTask, activeUserId)
      .then(data => console.log("✅ Task created via Server Action:", data))
      .catch(err => console.error("❌ Server Action Error:", err));
    // -------------------------

    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? { ...p, tasks: [...p.tasks, newTask] }
          : p
      )
    );

    setNewTitle("");
    setShouldScroll(true);
    if (newTitleRef.current) {
      newTitleRef.current.focus();
    }
  }, [newTitle, newPriority, selectedLabels, activeProjectId, setProjects, activeUserId]);

  const toggleTask = useCallback((id) => {
    const taskToToggle = actualTasksList.find(t => t.id === id);
    if (taskToToggle) {
      // --- SERVER ACTION MIRRORING ---
      updateTaskAction(id, { done: !taskToToggle.done }, activeUserId)
        .then(data => console.log("🔄 Task toggled via Server Action:", data))
        .catch(err => console.error("❌ Server Action Error:", err));
      // -------------------------
    }

    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === id ? { ...t, done: !t.done } : t
              ),
            }
          : p
      )
    );
  }, [actualTasksList, activeProjectId, setProjects, activeUserId]);

  const deleteTask = useCallback((id) => {
    // --- SERVER ACTION MIRRORING ---
    deleteTaskAction(id, activeUserId)
      .then(data => console.log("🗑️ Task deleted via Server Action:", data))
      .catch(err => console.error("❌ Server Action Error:", err));
    // -------------------------

    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? { ...p, tasks: p.tasks.filter((t) => t.id !== id) }
          : p
      )
    );
    localStorage.removeItem(`task-${id}-seconds`);
  }, [activeProjectId, setProjects, activeUserId]);

  const deleteAllTasks = useCallback(() => {
    // --- SERVER ACTION MIRRORING ---
    deleteAllTasksAction(activeProjectId, activeUserId)
      .then(data => console.log("🗑️ ALL Tasks deleted via Server Action for project:", data))
      .catch(err => console.error("❌ Server Action Error:", err));
    // -------------------------

    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId ? { ...p, tasks: [] } : p
      )
    );
  }, [activeProjectId, setProjects, activeUserId]);

  const deleteTaskLabel = useCallback((taskId, labelId) => {
    const taskToUpdate = actualTasksList.find(t => t.id === taskId);
    if (taskToUpdate) {
      const newLabels = taskToUpdate.labels.filter(id => id !== labelId);
      // --- SERVER ACTION MIRRORING ---
      updateTaskAction(taskId, { labels: newLabels }, activeUserId)
        .then(data => console.log("🏷️ Label removed from task via Server Action:", data))
        .catch(err => console.error("❌ Server Action Error:", err));
      // -------------------------
    }

    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, labels: t.labels.filter((lId) => lId !== labelId) }
                  : t
              ),
            }
          : p
      )
    );
  }, [actualTasksList, activeProjectId, setProjects, activeUserId]);

  const toggleLabelOnTask = useCallback((taskId, labelId) => {
    const taskToUpdate = actualTasksList.find(t => t.id === taskId);
    if (taskToUpdate) {
      const hasLabel = taskToUpdate.labels.includes(labelId);
      const newLabels = hasLabel ? taskToUpdate.labels.filter(id => id !== labelId) : [...taskToUpdate.labels, labelId];
      // --- SERVER ACTION MIRRORING ---
      updateTaskAction(taskId, { labels: newLabels }, activeUserId)
        .then(data => console.log("🏷️ Label toggled on task via Server Action:", data))
        .catch(err => console.error("❌ Server Action Error:", err));
      // -------------------------
    }

    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? {
              ...p,
              tasks: p.tasks.map((t) => {
                if (t.id !== taskId) return t;

                const hasLabel = t.labels.includes(labelId);

                return {
                  ...t,
                  labels: hasLabel
                    ? t.labels.filter((id) => id !== labelId) 
                    : [...t.labels, labelId],                 
                };
              }),
            }
          : p
      )
    );
  }, [actualTasksList, activeProjectId, setProjects, activeUserId]);

  const updateTask = useCallback((id, updatedTask) => {
    // --- SERVER ACTION MIRRORING ---
    updateTaskAction(id, updatedTask, activeUserId)
      .then(data => console.log("✏️ Task updated via Server Action:", data))
      .catch(err => console.error("❌ Server Action Error:", err));
    // -------------------------

    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === id ? { ...t, ...updatedTask } : t
              ),
            }
          : p
      )
    );
  }, [activeProjectId, setProjects, activeUserId]);

  return {
    newTitle, setNewTitle,
    newPriority, setNewPriority,
    selectedLabels, setSelectedLabels,
    newTitleRef,
    lastTaskRef,
    addTask,
    toggleTask,
    deleteTask,
    deleteTaskLabel,
    toggleLabelOnTask,
    updateTask,
    deleteAllTasks,
  };
}
