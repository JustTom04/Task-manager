import { useState, useMemo, useEffect, useCallback } from "react";
import { useTaskState } from "./useTaskState";
import { useLabelState } from "./useLabelState";
import { useTaskFilterState } from "./useTaskFilterState";

export function useProjectState() {
  // ===== Initial Projects =====
  const initialProjects = () => {
    const saved = localStorage.getItem("projects");
    if (saved) return JSON.parse(saved);

    return [
      {
        id: crypto.randomUUID(),
        name: "General",
        tasks: [
          { id: 1, title: "Programming", done: false, priority: "high", labels: [1, 2] },
          { id: 2, title: "Work out", done: false, priority: "mid", labels: [1, 2], },
          { id: 3, title: "Learning English", done: false, priority: "low", labels: [1, 2], },
        ],
        labels: [
          { id: 1, name: "Work", color: "#f28b82" },
          { id: 2, name: "Personal", color: "#fbbc04" },
          { id: 3, name: "Urgent", color: "#34a853" },
        ],
      },
    ];
  };

  
  const [projects, setProjects] = useState(initialProjects());
  const savedProjectId = localStorage.getItem("activeProjectId");
  const [activeProjectId, setActiveProjectId] = useState(
    savedProjectId || projects[0].id
  );

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


  const deleteProject = useCallback((projectId) => {
    setProjects((prevProjects) => {
      if (prevProjects[0].id === projectId) {
        return prevProjects;
      }

      const newProjects = prevProjects.filter((p) => p.id !== projectId);

      setActiveProjectId((prevActiveId) => {
        const stillExists = newProjects.find(p => p.id === prevActiveId);
        if (stillExists) return prevActiveId;        
        return newProjects.length > 0 ? newProjects[0].id : null; 
      });

      return newProjects;
    });
  }, [setProjects, setActiveProjectId]);

  // ===== LocalStorage Sync =====
  useEffect(() => {
    localStorage.setItem("projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem("activeProjectId", activeProjectId);
  }, [activeProjectId]);

  // ===== Task State Hook =====
  const taskState = useTaskState({ actualTasksList, activeProjectId, setProjects });

  // ===== Label State Hook =====
  const labelState = useLabelState( {actualLabelsList, activeProjectId, setProjects})

  // ===== Filter State Hook =====
  const taskFilterState = useTaskFilterState( {actualTasksList} )

  return {
    projects, setProjects,
    activeProjectId, setActiveProjectId,
    deleteProject,
    actualProject,
    actualTasksList,
    actualLabelsList,
    taskState,
    labelState,
    taskFilterState
  };
}
