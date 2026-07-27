import { useState, useMemo, useEffect, useCallback } from "react";
import { useTaskState } from "./useTaskState";
import { useLabelState } from "./useLabelState";
import { useTaskFilterState } from "./useTaskFilterState";

import { INPUT_LENGTH, getUserId } from "../utils.js";

// --- NEXT.JS SERVER ACTIONS IMPORT ---
import { getProjects, createProject, deleteProject as deleteProjectAction, updateProject as updateProjectAction } from "@/backend/actions/projectActions";
import { deleteLabel as deleteLabelAction, deleteAllLabels as deleteAllLabelsAction } from "@/backend/actions/labelActions";

export function useProjectState() {
  // ===== Initial Projects =====
  // Projects are fully loaded directly from PostgreSQL via Next.js Server Actions!
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

  // --- SERVER ACTION MIRRORING (GET AGGREGATED PROJECTS TREE) ---
  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;

    getProjects(userId)
      .then(projectsTree => {
        console.log("📥 Full Projects Tree loaded from Server Action:", projectsTree);
        if (projectsTree && projectsTree.length > 0) {
          setProjects(projectsTree);

          // Ensure the activeProjectId from LocalStorage still exists in backend data
          const stillExists = projectsTree.find(p => p.id === activeProjectId);
          if (!stillExists) {
            setActiveProjectId(projectsTree[0].id);
          }
        }
      })
      .catch(err => console.error("❌ Server Action Error (getProjects):", err));
  }, []); // Run only once on component mount
  // --------------------------------------

  // ===== Delete label functions =====
  const deleteLabel = useCallback(
    (id) => {
      // --- SERVER ACTION MIRRORING ---
      deleteLabelAction(id)
        .then(data => console.log("🗑️ Label deleted via Server Action:", data))
        .catch(err => console.error("❌ Server Action Error:", err));
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
    // --- SERVER ACTION MIRRORING ---
    deleteAllLabelsAction(activeProjectId)
      .then(data => console.log("🗑️ ALL Labels deleted via Server Action for project:", data))
      .catch(err => console.error("❌ Server Action Error:", err));
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

  // ===== Project functions =====
  const addProject = useCallback((name) => {
    const trimmedName = name?.trim();
    if (!trimmedName) return;

    if (trimmedName.length > INPUT_LENGTH.PROJECT_NAME) return;

    const generalLabels = projects[0]?.labels || [];

    const newProject = {
      id: crypto.randomUUID(),
      name: trimmedName,
      tasks: [],
      labels: generalLabels.map((l) => ({ ...l, id: crypto.randomUUID() })),
    };

    // --- SERVER ACTION MIRRORING ---
    createProject({ ...newProject, userId: getUserId() })
      .then(data => console.log("✅ Project created via Server Action:", data))
      .catch(err => console.error("❌ Server Action Error:", err));
    // -------------------------

    setProjects((prev) => [...prev, newProject]);
    setActiveProjectId(newProject.id);
  }, [projects]);

  const deleteProject = useCallback((projectId) => {
    // --- SERVER ACTION MIRRORING ---
    deleteProjectAction(projectId)
      .then(data => console.log("🗑️ Project deleted via Server Action:", data))
      .catch(err => console.error("❌ Server Action Error:", err));
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

  const renameProject = useCallback((projectId, newName) => {
    const trimmedName = newName?.trim();
    if (!trimmedName || trimmedName.length > INPUT_LENGTH.PROJECT_NAME) return;

    // Local optimistic update
    setProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, name: trimmedName } : p
    ));

    // Server Action update
    updateProjectAction({ id: projectId, name: trimmedName })
      .then(data => console.log("✅ Project renamed via Server Action:", data))
      .catch(err => console.error("❌ Server Action Error:", err));
  }, [setProjects]);

  // ===== UI State Sync =====
  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem("activeProjectId", activeProjectId);
    }
  }, [activeProjectId]);

  // ===== Task State Hook =====
  const taskState = useTaskState({ actualTasksList, activeProjectId, setProjects });

  // ===== Label State Hook =====
  const labelState = useLabelState({ actualLabelsList, activeProjectId, setProjects });

  return {
    projects, setProjects,
    activeProjectId, setActiveProjectId,
    addProject,
    deleteProject,
    renameProject,
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
