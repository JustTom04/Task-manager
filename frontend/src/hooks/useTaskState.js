import { INPUT_LENGTH } from "@/utils";
import { useState,  useEffect, useRef, useCallback } from "react";

const API_URL = "http://localhost:3000/api/tasks";

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

  // --- BACKEND MIRRORING (GET) ---
  // Load tasks from Backend on mount or when activeProjectId changes
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(tasksFromBackend => {
        console.log("📥 Tasks loaded from Backend:", tasksFromBackend);
        setProjects(prev => prev.map(p => 
          p.id === activeProjectId 
            ? { ...p, tasks: tasksFromBackend }
            : p
        ));
      })
      .catch(err => console.error("❌ Backend Error (GET):", err));
  }, [activeProjectId, setProjects]);
  // -------------------------------


  
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

    // --- BACKEND MIRRORING ---
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTask),
    })
      .then(res => res.json())
      .then(data => console.log("✅ Task created on Backend:", data))
      .catch(err => console.error("❌ Backend Error:", err));
    // -------------------------

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
    const taskToToggle = actualTasksList.find(t => t.id === id);
    if (taskToToggle) {
      // --- BACKEND MIRRORING ---
      fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !taskToToggle.done }),
      })
        .then(res => res.json())
        .then(data => console.log("🔄 Task toggled on Backend:", data))
        .catch(err => console.error("❌ Backend Error:", err));
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
  }, [activeProjectId, setProjects]);


  const deleteTask = useCallback((id) => {
    // --- BACKEND MIRRORING ---
    fetch(`${API_URL}/${id}`, { method: "DELETE" })
      .then(res => res.json())
      .then(data => console.log("🗑️ Task deleted on Backend:", data))
      .catch(err => console.error("❌ Backend Error:", err));
    // -------------------------

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
    // --- BACKEND MIRRORING ---
    fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedTask),
    })
      .then(res => res.json())
      .then(data => console.log("✏️ Task updated on Backend:", data))
      .catch(err => console.error("❌ Backend Error:", err));
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
