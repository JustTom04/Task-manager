import React, { useState, useRef } from "react";
import LabelsPanel from "./LabelsPanel";
import CustomDropdown from "./CustomDropdown";
import { ConfirmConfig } from "../modals/ConfirmModal";
import { useClickOutside, INPUT_LENGTH, useDropdownPosition } from "@/frontend/utils";
import useStore from "@/frontend/store/useStore";
import FiltersBar from "./TopSectionComponents/FiltersBar";
import DeleteActions from "./TopSectionComponents/DeleteActions";

interface TopSectionProps {
  isMobile?: boolean;
  setConfirmConfig: (config: ConfirmConfig | null) => void;
  setShowLabelModal: (show: boolean) => void;
}

function TopSection({
  isMobile,
  setConfirmConfig,
  setShowLabelModal,
}: TopSectionProps) {

  // ===== Labels =====
  const [labelsOpen, setLabelsOpen] = useState(false);
  const labelsRef = useRef<HTMLDivElement>(null);
  const labelsButtonRef = useRef<HTMLButtonElement>(null);

  useClickOutside(labelsRef, () => setLabelsOpen(false));
  const dropdownPos = useDropdownPosition(labelsButtonRef, labelsOpen);

  // ===== Delete labels extracted to DeleteActions =====

  const newTitleRef = useRef<HTMLInputElement>(null);
  const newTitle = useStore(s => s.newTitle);
  const setNewTitle = useStore(s => s.setNewTitle);
  const newPriority = useStore(s => s.newPriority);
  const setNewPriority = useStore(s => s.setNewPriority);
  const selectedLabels = useStore(s => s.selectedLabels);
  const setSelectedLabels = useStore(s => s.setSelectedLabels);
  const _addTask = useStore(s => s.addTask);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    _addTask(newTitle, newPriority, selectedLabels);
  };

  const projects = useStore(s => s.projects);
  const activeProjectId = useStore(s => s.activeProjectId);
  const actualProject = projects.find(p => p.id === activeProjectId);
  const actualLabelsList = actualProject?.labels || [];

  // =====================================================
  // ===================== MOBILE ========================
  // =====================================================
  if (isMobile) {
    return (
      <div className="top-section">
        <div className="section-group">
          {/* ===== Filters ===== */}
          <FiltersBar />

          <div className="section buttons">
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
                  position={dropdownPos}
                  ref={labelsRef}
                />
              )}
            </div>

            <button
              className="done"
              onClick={() => setShowLabelModal(true)}
            >
              ➕ Create label
            </button>
          </div>
        </div>

        {/* ===== Add task ===== */}
        <div className="section-group">
          <form onSubmit={addTask} className="section form-container">
            <input
              type="text"
              maxLength={INPUT_LENGTH.TASK_TITLE}
              placeholder="Task title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              ref={newTitleRef}
            />

            <CustomDropdown
              value={newPriority}
              wrapperClass="add-task-selection"
              onChange={setNewPriority}
              options={[
                { value: "high", label: "High" },
                { value: "mid", label: "Mid" },
                { value: "low", label: "Low" }
              ]}
            />

            <button type="submit" className="task-button done">
              Add task
            </button>
          </form>

          <DeleteActions setConfirmConfig={setConfirmConfig} />
        </div>
      </div>
    );
  }

  // =====================================================
  // ==================== DESKTOP ========================
  // =====================================================
  return (
    <div className="top-section">
      <div className="section-group">

        {/* ===== Filters ===== */}
        <FiltersBar />

        <div className="section buttons">
          <button
            className="done"
            onClick={() => setShowLabelModal(true)}
          >
            ➕ Create label
          </button>
        </div>

      </div>

      <div className="section-group">
        {/* ===== Add new task ===== */}
        <form onSubmit={addTask} className="section form-container">
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

          <input
            type="text"
            maxLength={INPUT_LENGTH.TASK_TITLE}
            placeholder="Task title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            ref={newTitleRef}
          />

          <CustomDropdown
            value={newPriority}
            wrapperClass="priority-dropdown"
            onChange={setNewPriority}
            options={[
              { value: "high", label: "High" },
              { value: "mid", label: "Mid" },
              { value: "low", label: "Low" }
            ]}
          />

          <button type="submit" className="task-button done">
            Add task
          </button>
        </form>

        <DeleteActions setConfirmConfig={setConfirmConfig} />
      </div>
    </div>
  );
}

export default TopSection;


