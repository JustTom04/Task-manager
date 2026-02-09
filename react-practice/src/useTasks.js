import { useCallback } from "react";

export function useTasks(activeProjectId, setProjects) {

  const addTask = useCallback((task) => {
    setProjects(prev =>
      prev.map(p =>
        p.id === activeProjectId
          ? { ...p, tasks: [...p.tasks, task] }
          : p
      )
    );
  }, [activeProjectId]);

  const toggleTask = useCallback((taskId) => {
    setProjects(prev =>
      prev.map(p =>
        p.id === activeProjectId
          ? {
              ...p,
              tasks: p.tasks.map(t =>
                t.id === taskId ? { ...t, done: !t.done } : t
              )
            }
          : p
      )
    );
  }, [activeProjectId]);

  const deleteTask = useCallback((taskId) => {
    setProjects(prev =>
      prev.map(p =>
        p.id === activeProjectId
          ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) }
          : p
      )
    );

    localStorage.removeItem(`task-${id}-seconds`);
  }, [activeProjectId]);

  return { addTask, toggleTask, deleteTask };
}
