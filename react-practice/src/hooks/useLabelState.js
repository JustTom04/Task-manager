import { useState, useRef, useCallback } from "react";

import { INPUT_LENGTH } from "../utils.js";

export function useLabelState({ actualLabelsList, activeProjectId, setProjects }) {

  // ===== Label functions =====
  const deleteLabel = useCallback(
    (id) => {
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
    },
    [activeProjectId]
  );

  const deleteAllLabels = useCallback(() => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId ? { ...p, labels: [] } : p
      )
    );
  }, [activeProjectId]);

  const addLabelToProject = useCallback(
    (newLabel) => {
      const trimmedName = newLabel.name?.trim();
      if (!trimmedName) return;
      
      if (trimmedName.length > INPUT_LENGTH.LABEL_NAME) return;
      
      setProjects((prev) =>
        prev.map((p) =>
          p.id === activeProjectId
            ? { ...p, labels: [...(p.labels || []), newLabel] }
            : p
        )
      );
    },
    [activeProjectId]
  );

  return {deleteLabel, deleteAllLabels, addLabelToProject};
}

