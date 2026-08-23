import { INPUT_LENGTH } from "../utils";
import { useState, useEffect, useRef, useCallback } from "react";

// --- NEXT.JS SERVER ACTIONS IMPORT ---
import { createTask, updateTask as updateTaskAction, deleteTask as deleteTaskAction, deleteAllTasks as deleteAllTasksAction } from "@/backend/actions/taskActions";

export function useTaskState({ actualTasksList, activeProjectId, setProjects, activeUserId, taskFilterState }) {
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

    // Check if the new task matches current filters before adding it to UI
    const matchesFilter = () => {
      if (taskFilterState?.statusFilter === "Finished" && !newTask.done) return false;
      if (taskFilterState?.statusFilter === "On working" && newTask.done) return false;
      
      if (taskFilterState?.priorityFilter && taskFilterState.priorityFilter !== "ALL") {
        if (newTask.priority.toLowerCase() !== taskFilterState.priorityFilter.toLowerCase()) return false;
      }
      
      if (taskFilterState?.labelsFilter?.length > 0) {
        const hasLabel = newTask.labels.some((lId) => taskFilterState.labelsFilter.includes(lId));
        if (!hasLabel) return false;
      }
      
      return true;
    };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== activeProjectId) return p;
        
        // Only append to the UI if it actually belongs in the currently filtered view
        const updatedTasks = matchesFilter() ? [...p.tasks, newTask] : p.tasks;
        
        return { ...p, tasks: updatedTasks };
      })
    );

    setNewTitle("");
    setShouldScroll(true);
    if (newTitleRef.current) {
      newTitleRef.current.focus();
    }
  }, [newTitle, newPriority, selectedLabels, activeProjectId, setProjects, activeUserId, taskFilterState]);

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
      prev.map((p) => {
        if (p.id !== activeProjectId) return p;

        let newTasks = p.tasks.map((t) =>
          t.id === id ? { ...t, done: !t.done } : t
        );

        // Optimistically remove task if it no longer matches the current status filter
        if (taskFilterState?.statusFilter === "Finished") {
          newTasks = newTasks.filter((t) => t.done);
        } else if (taskFilterState?.statusFilter === "On working") {
          newTasks = newTasks.filter((t) => !t.done);
        }

        return { ...p, tasks: newTasks };
      })
    );
  }, [actualTasksList, activeProjectId, setProjects, activeUserId, taskFilterState]);

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
      prev.map((p) => {
        if (p.id !== activeProjectId) return p;
        
        let newTasks = p.tasks.map((t) =>
          t.id === taskId
            ? { ...t, labels: t.labels.filter((lId) => lId !== labelId) }
            : t
        );

        // Optimistically remove if it no longer matches the label filter
        if (taskFilterState?.labelsFilter?.length > 0) {
          newTasks = newTasks.filter((t) =>
            taskFilterState.labelsFilter.every((filterLabel) =>
              t.labels.includes(filterLabel)
            ) || t.labels.some((lId) => taskFilterState.labelsFilter.includes(lId)) // Depending on AND/OR logic
          );
          // Actually, our backend filter uses 'some' (OR logic).
          newTasks = newTasks.filter((t) => 
            t.labels.some((lId) => taskFilterState.labelsFilter.includes(lId))
          );
        }

        return { ...p, tasks: newTasks };
      })
    );
  }, [actualTasksList, activeProjectId, setProjects, activeUserId, taskFilterState]);

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
      prev.map((p) => {
        if (p.id !== activeProjectId) return p;

        let newTasks = p.tasks.map((t) =>
          t.id === id ? { ...t, ...updatedTask } : t
        );

        // Optimistically remove if it no longer matches priority or status filter
        if (taskFilterState?.statusFilter === "Finished") {
          newTasks = newTasks.filter((t) => t.done);
        } else if (taskFilterState?.statusFilter === "On working") {
          newTasks = newTasks.filter((t) => !t.done);
        }

        if (taskFilterState?.priorityFilter && taskFilterState.priorityFilter !== "ALL") {
          newTasks = newTasks.filter(
            (t) => t.priority.toLowerCase() === taskFilterState.priorityFilter.toLowerCase()
          );
        }

        return { ...p, tasks: newTasks };
      })
    );
  }, [activeProjectId, setProjects, activeUserId, taskFilterState]);

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
