import { useCallback } from "react";
import { INPUT_LENGTH } from "../utils.js";

// --- NEXT.JS SERVER ACTIONS IMPORT ---
import { createLabel } from "@/backend/actions/labelActions";

export function useLabelState({ actualLabelsList, activeProjectId, setProjects, activeUserId }) {

  const addLabelToProject = useCallback(
    (newLabel) => {
      const trimmedName = newLabel.name?.trim();
      if (!trimmedName) return;
      
      if (trimmedName.length > INPUT_LENGTH.LABEL_NAME) return;
      
      // Inject the relationship mapping
      newLabel.projectIds = [activeProjectId];

      // --- SERVER ACTION MIRRORING ---
      createLabel(newLabel, activeUserId)
        .then(data => console.log("✅ Label created via Server Action:", data))
        .catch(err => console.error("❌ Server Action Error:", err));
      // -------------------------

      setProjects((prev) =>
        prev.map((p) =>
          p.id === activeProjectId
            ? { ...p, labels: [...(p.labels || []), newLabel] }
            : p
        )
      );
    },
    [activeProjectId, setProjects, activeUserId]
  );

  return { addLabelToProject };
}
