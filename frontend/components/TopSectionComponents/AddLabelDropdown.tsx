import React, { useState, useRef } from "react";
import LabelsPanel from "../LabelsPanel";
import { useClickOutside, useDropdownPosition } from "@/frontend/utils";
import useStore from "@/frontend/store/useStore";

export default function AddLabelDropdown() {
  const [labelsOpen, setLabelsOpen] = useState(false);
  const labelsRef = useRef<HTMLDivElement>(null);
  const labelsButtonRef = useRef<HTMLButtonElement>(null);

  useClickOutside(labelsRef, () => setLabelsOpen(false));
  const dropdownPos = useDropdownPosition(labelsButtonRef, labelsOpen);

  const selectedLabels = useStore(s => s.selectedLabels);
  const setSelectedLabels = useStore(s => s.setSelectedLabels);
  
  const projects = useStore(s => s.projects);
  const activeProjectId = useStore(s => s.activeProjectId);
  const actualProject = projects.find(p => p.id === activeProjectId);
  const actualLabelsList = actualProject?.labels || [];

  return (
    <div className="labels-select">
      <button
        type="button"
        ref={labelsButtonRef}
        className="labels-button"
        onClick={() => setLabelsOpen((prev) => !prev)}
      >
        Add labels
      </button>

      {labelsOpen && (
        <LabelsPanel
          labels={actualLabelsList}
          selectedIds={selectedLabels}
          onToggle={(id) => setSelectedLabels(prev =>
            prev.includes(id)
              ? prev.filter(l => l !== id)
              : [...prev, id]
          )}
          showDelete={false}
          position={dropdownPos}
          ref={labelsRef}
        />
      )}
    </div>
  );
}
