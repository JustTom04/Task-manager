import { useState, useMemo, useEffect, useCallback } from "react";
import { useTaskState } from "./useTaskState";
import { useLabelState } from "./useLabelState";
import { useTaskFilterState } from "./useTaskFilterState";

import { INPUT_LENGTH } from "../utils.js";

const LABELS_API_URL = "http://localhost:3000/api/labels";

export function useProjectState() {

  // ===== Initial Projects =====
  // Projects are now fully loaded from the Backend API, no more LocalStorage defaults!
  const [projects, setProjects] = useState([]);
  
  // We keep activeProjectId in LocalStorage purely for UI/UX memory
  const savedProjectId = localStorage.getItem("activeProjectId");
  const [activeProjectId, setActiveProjectId] = useState(savedProjectId || null);

  /* ===== Actual items ===== */
  const actualProject = useMemo(() => {
    return projects.find(p => p.id === activeProjectId);
  }, [projects, activeProjectId]);

  const actualTasksList = useMemo(() => {
    return actualProject?.tasks || [];
  }, [projects, activeProjectId]);

  const actualLabelsList = useMemo(() => {
    return actualProject?.labels || [];
  }, [projects, activeProjectId]);


  // ===== Filter State Hook =====
  const taskFilterState = useTaskFilterState({ actualTasksList });
  const { labelsFilter, setLabelsFilter } = taskFilterState;

  // --- BACKEND MIRRORING (GET AGGREGATED PROJECTS TREE) ---
  useEffect(() => {
    fetch("http://localhost:3000/api/projects")
      .then(res => res.json())
      .then(projectsTree => {
        console.log("📥 Full Projects Tree loaded from Backend:", projectsTree);
        if (projectsTree.length > 0) {
          setProjects(projectsTree);

          // Ensure the activeProjectId from LocalStorage still exists in backend data
          const stillExists = projectsTree.find(p => p.id === activeProjectId);
          if (!stillExists) {
            setActiveProjectId(projectsTree[0].id);
          }
        }
      })
      .catch(err => console.error("❌ Backend Error (GET Projects):", err));
  }, []); // Run only once on component mount
  // --------------------------------------

  // ===== Delete label functions =====
  const deleteLabel = useCallback(
    (id) => {
      // --- BACKEND MIRRORING ---
      fetch(`${LABELS_API_URL}/${id}`, { method: "DELETE" })
        .then(res => res.json())
        .then(data => console.log("🗑️ Label deleted on Backend:", data))
        .catch(err => console.error("❌ Backend Error:", err));
      // -------------------------

      setProjects((prev) =>
        prev.map((p) =>
          p.id === activeProjectId
            ? {
              ...p,
              labels: p.labels.filter((label) => label.id !== id),
              tasks: p.tasks.map((task) => ({
                ...task,
                labels: task.labels.filter((lid) => lid !== id),
              })),
            }
            : p
        )
      );

      setLabelsFilter((prev) => prev.filter((lid) => lid !== id));
    },
    [activeProjectId, setLabelsFilter]
  );

  const deleteAllLabels = useCallback(() => {
    // --- BACKEND MIRRORING ---
    fetch(`${LABELS_API_URL}?projectId=${activeProjectId}`, { method: "DELETE" })
      .then(res => res.json())
      .then(data => console.log("🗑️ ALL Labels deleted on Backend for project:", data))
      .catch(err => console.error("❌ Backend Error:", err));
    // -------------------------

    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? { ...p, labels: [], tasks: p.tasks.map(t => ({ ...t, labels: [] })) }
          : p
      )
    );

    setLabelsFilter([]);
  }, [activeProjectId, setLabelsFilter]);


  // ===== Project functions
  const addProject = useCallback((name) => {
    const trimmedName = name?.trim();
    if (!trimmedName) return;

    if (trimmedName.length > INPUT_LENGTH.PROJECT_NAME) return

    const generalLabels = projects[0]?.labels || [];

    const newProject = {
      id: crypto.randomUUID(),
      name: trimmedName,
      tasks: [],
      labels: generalLabels.map((l) => ({ ...l })),
    };

    // --- BACKEND MIRRORING ---
    fetch("http://localhost:3000/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProject),
    })
      .then(res => res.json())
      .then(data => console.log("✅ Project created on Backend:", data))
      .catch(err => console.error("❌ Backend Error:", err));
    // -------------------------

    setProjects((prev) => [...prev, newProject]);
    setActiveProjectId(newProject.id);
  }, [projects]);


  const deleteProject = useCallback((projectId) => {
    // --- BACKEND MIRRORING ---
    fetch(`http://localhost:3000/api/projects/${projectId}`, { method: "DELETE" })
      .then(res => res.json())
      .then(data => console.log("🗑️ Project deleted on Backend:", data))
      .catch(err => console.error("❌ Backend Error:", err));
    // -------------------------

    setProjects((prevProjects) => {
      if (prevProjects[0].id === projectId) {
        return prevProjects;
      }

      const newProjects = prevProjects.filter((p) => p.id !== projectId);

      setActiveProjectId((prevActiveId) => {
        const stillExists = newProjects.find(p => p.id === prevActiveId);
        if (stillExists) return prevActiveId;
        return newProjects[0].id;
      });

      return newProjects;
    });
  }, [setProjects, setActiveProjectId]);

  // ===== UI State Sync =====
  // We only save the active project ID to remember the user's last viewed tab
  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem("activeProjectId", activeProjectId);
    }
  }, [activeProjectId]);

  // ===== Task State Hook =====
  const taskState = useTaskState({ actualTasksList, activeProjectId, setProjects });

  // ===== Label State Hook =====
  const labelState = useLabelState({ actualLabelsList, activeProjectId, setProjects })

  return {
    projects, setProjects,
    activeProjectId, setActiveProjectId,
    addProject,
    deleteProject,
    actualProject,
    actualTasksList,
    actualLabelsList,
    taskState,
    labelState,
    taskFilterState,
    deleteLabel,
    deleteAllLabels,
  };
}
