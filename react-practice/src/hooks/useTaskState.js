import { INPUT_LENGTH } from "@/utils";
import { useState,  useEffect, useRef, useCallback } from "react";

export function useTaskState({ actualTasksList, activeProjectId, setProjects }) {
  // ===== States =====
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("mid");
  const [selectedLabels, setSelectedLabels] = useState([]);

  // ===== Refs =====
  const newTitleRef = useRef(null);
  const lastTaskRef = useRef(null);


  // ===== Scroll to last task =====
  useEffect(() => {
    if (lastTaskRef.current) {
      lastTaskRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [actualTasksList]);

  
  // ===== Task functions =====
  const addTask = useCallback((e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (newTitle.length > INPUT_LENGTH.TASK_TITLE) return

    const newTask = {
      id: crypto.randomUUID(),
      title: newTitle,
      done: false,
      priority: newPriority,
      labels: selectedLabels,
    };

    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? { ...p, tasks: [...p.tasks, newTask] }
          : p
      )
    );

    setNewTitle("");
    newTitleRef.current.focus();
  }, [newTitle, newPriority, selectedLabels, activeProjectId, setProjects]);


  const toggleTask = useCallback((id) => {
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
  }, [activeProjectId, setProjects]);


  const deleteTask = useCallback((id) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? { ...p, tasks: p.tasks.filter((t) => t.id !== id) }
          : p
      )
    );
    localStorage.removeItem(`task-${id}-seconds`);
  }, [activeProjectId, setProjects]);

  
  const deleteAllTasks = useCallback(() => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId ? { ...p, tasks: [] } : p
      )
    );
  }, [activeProjectId, setProjects]);


  const deleteTaskLabel = useCallback((taskId, labelId) => {
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
  }, [activeProjectId, setProjects]);


  const toggleLabelOnTask = useCallback((taskId, labelId) => {
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
  }, [activeProjectId, setProjects]);


  const updateTask = useCallback((id, updatedTask) => {
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
  }, [activeProjectId, setProjects]);

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
