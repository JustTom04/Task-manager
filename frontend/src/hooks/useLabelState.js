import { useState, useRef, useCallback } from "react";

import { INPUT_LENGTH } from "../utils.js";

const API_URL = "http://localhost:3000/api/labels";

export function useLabelState({ actualLabelsList, activeProjectId, setProjects }) {

  const addLabelToProject = useCallback(
    (newLabel) => {
      const trimmedName = newLabel.name?.trim();
      if (!trimmedName) return;
      
      if (trimmedName.length > INPUT_LENGTH.LABEL_NAME) return;
      
      // --- BACKEND MIRRORING ---
      fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLabel),
      })
        .then(res => res.json())
        .then(data => console.log("✅ Label created on Backend:", data))
        .catch(err => console.error("❌ Backend Error:", err));
      // -------------------------

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

