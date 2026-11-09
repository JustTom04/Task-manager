import React, { useState, useRef } from "react";
import LabelsPanel from "../LabelsPanel";
import { useClickOutside, useDropdownPosition } from "@/frontend/utils";
import useStore from "@/frontend/store/useStore";

export default function AddLabelDropdown() {
  const [labelsOpen, setLabelsOpen] = useState(false);
  const labelsRef = useRef<HTMLDivElement>(null);
  const labelsButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useClickOutside([labelsRef, panelRef], () => setLabelsOpen(false));
  const dropdownPos = useDropdownPosition(labelsButtonRef, labelsOpen, () => setLabelsOpen(false));

  const selectedLabels = useStore(s => s.selectedLabels);
  const setSelectedLabels = useStore(s => s.setSelectedLabels);

  const projects = useStore(s => s.projects);
  const activeProjectId = useStore(s => s.activeProjectId);
  const actualProject = projects.find(p => p.id === activeProjectId);
  const actualLabelsList = actualProject?.labels || [];
  const selectedCount = actualLabelsList.filter(l => selectedLabels.includes(l.id)).length;

  return (
    <div className="labels-select" ref={labelsRef}>
      <button
        type="button"
        ref={labelsButtonRef}
        className="labels-button"
        aria-expanded={labelsOpen}
        aria-haspopup="true"
        onClick={() => setLabelsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setLabelsOpen(true);
          } else if (e.key === "Escape" && labelsOpen) {
            e.preventDefault();
            setLabelsOpen(false);
          }
        }}
      >
        {selectedCount > 0 ? `Add labels (${selectedCount})` : "Add labels"}
      </button>

      {labelsOpen && (
        <LabelsPanel
          ref={panelRef}
          labels={actualLabelsList}
          selectedIds={selectedLabels}
          onToggle={(id) => setSelectedLabels(prev =>
            prev.includes(id)
              ? prev.filter(l => l !== id)
              : [...prev, id]
          )}
          showDelete={false}
          position={dropdownPos}
          onClose={() => {
            setLabelsOpen(false);
            labelsButtonRef.current?.focus();
          }}
        />
      )}
    </div>
  );
}
