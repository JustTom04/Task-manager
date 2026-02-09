import { useState, useEffect, useMemo, useCallback } from "react";

export function useProjects() {
  const initialProjects = () => {
    const saved = localStorage.getItem("projects");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: crypto.randomUUID(),
        name: "General",
        tasks: [
          { id: 1, title: "Programming", done: false, priority: "high", labels: [1, 2] },
          { id: 2, title: "Work out", done: false, priority: "mid", labels: [1, 2] },
          { id: 3, title: "Learning English", done: false, priority: "low", labels: [1, 2] },
        ],
        labels: [
          { id: 1, name: "Work", color: "#f28b82" },
          { id: 2, name: "Personal", color: "#fbbc04" },
          { id: 3, name: "Urgent", color: "#34a853" },
        ]
      }
    ];
  };

  const [projects, setProjects] = useState(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState(
    localStorage.getItem("activeProjectId") || projects[0].id
  );

  useEffect(() => {
    localStorage.setItem("projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem("activeProjectId", activeProjectId);
  }, [activeProjectId]);

  const activeProject = useMemo(
    () => projects.find(p => p.id === activeProjectId),
    [projects, activeProjectId]
  );

  const addLabelToProject = useCallback((label) => {
    setProjects(prev =>
      prev.map(p =>
        p.id === activeProjectId
          ? { ...p, labels: [...p.labels, label] }
          : p
      )
    );
  }, [activeProjectId]);

  const deleteLabel = useCallback((labelId) => {
    setProjects(prev =>
      prev.map(p =>
        p.id === activeProjectId
          ? {
              ...p,
              labels: p.labels.filter(l => l.id !== labelId),
              tasks: p.tasks.map(t => ({
                ...t,
                labels: t.labels.filter(id => id !== labelId)
              }))
            }
          : p
      )
    );
  }, [activeProjectId]);

  return {
    projects,
    activeProject,
    activeProjectId,
    setActiveProjectId,
    setProjects,
    addLabelToProject,
    deleteLabel
  };
}
