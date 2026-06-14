import { useState, useRef, useCallback } from "react";

import { INPUT_LENGTH } from "../utils.js";

export function useLabelState({ actualLabelsList, activeProjectId, setProjects }) {

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

  return {addLabelToProject};
}

