import React, { useState, useRef } from "react";
import LabelsPanel from "./LabelsPanel";
import CustomDropdown from "./CustomDropdown";
import { useClickOutside, INPUT_LENGTH, useDropdownPosition } from "@/frontend/utils";
import useStore from "@/frontend/store/useStore";

interface TopSectionProps {
  isMobile?: boolean;
  setConfirmConfig: (config: any) => void;
  setShowLabelModal: (show: boolean) => void;
  activeUserId: string;
}

function TopSection({
  isMobile,
  setConfirmConfig,
  setShowLabelModal,
  activeUserId,
}: TopSectionProps) {

  // ===== Labels =====
  const [labelsOpen, setLabelsOpen] = useState(false);
  const labelsRef = useRef<HTMLDivElement>(null);
  const labelsButtonRef = useRef<HTMLButtonElement>(null);

  useClickOutside(labelsRef, () => setLabelsOpen(false));
  const dropdownPos = useDropdownPosition(labelsButtonRef, labelsOpen);

  // ===== Delete labels =====
  const [deleteLabelsOpen, setDeleteLabelsOpen] = useState(false);
  const deleteLabelsRef = useRef<HTMLDivElement>(null);
  const deleteLabelsButtonRef = useRef<HTMLButtonElement>(null);

  useClickOutside(deleteLabelsRef, () => setDeleteLabelsOpen(false));
  const deleteLabelsPos = useDropdownPosition(deleteLabelsButtonRef, deleteLabelsOpen);

  const newTitleRef = useRef<HTMLInputElement>(null);
  const newTitle = useStore(s => s.newTitle);
  const setNewTitle = useStore(s => s.setNewTitle);
  const newPriority = useStore(s => s.newPriority);
  const setNewPriority = useStore(s => s.setNewPriority);
  const selectedLabels = useStore(s => s.selectedLabels);
  const setSelectedLabels = useStore(s => s.setSelectedLabels);
  const _addTask = useStore(s => s.addTask);
  const _deleteAllTasks = useStore(s => s.deleteAllTasks);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    _addTask(newTitle, newPriority, selectedLabels, activeUserId);
  };
  const deleteAllTasks = () => _deleteAllTasks(activeUserId);

  const labelsFilter = useStore(s => s.labelsFilter);
  const setLabelsFilter = useStore(s => s.setLabelsFilter);
  const statusFilter = useStore(s => s.statusFilter);
  const setStatusFilter = useStore(s => s.setStatusFilter);
  const priorityFilter = useStore(s => s.priorityFilter);
  const setPriorityFilter = useStore(s => s.setPriorityFilter);

  const projects = useStore(s => s.projects);
  const activeProjectId = useStore(s => s.activeProjectId);
  const actualProject = projects.find(p => p.id === activeProjectId);
  const actualTasksList = actualProject?.tasks || [];
  const actualLabelsList = actualProject?.labels || [];

  const _deleteLabel = useStore(s => s.deleteLabel);
  const _deleteAllLabels = useStore(s => s.deleteAllLabels);
  const deleteLabel = (id: string) => _deleteLabel(id, activeUserId);
  const deleteAllLabels = () => _deleteAllLabels(activeUserId);

  const options = {
    status: [
      { value: "ALL", label: "All status" },
      { value: "Finished", label: "Finished" },
      { value: "On working", label: "On working" },
    ],
    priority: [
      { value: "ALL", label: "Any priority" },
      { value: "high", label: "High" },
      { value: "mid", label: "Mid" },
      { value: "low", label: "Low" },
    ],
  };


  // =====================================================
  // ===================== MOBILE ========================
  // =====================================================
  if (isMobile) {
    return (
      <div className="top-section">
        <div className="section-group">
          {/* ===== Filters ===== */}
          <div className="section">
            <CustomDropdown
              icon="filter-icon"
              value={null}
              options={[]}
              customPanel={({ close, position, ref }) => (
                <LabelsPanel
                  labels={actualLabelsList}
                  selectedIds={labelsFilter}
                  onToggle={(id) => setLabelsFilter(prev =>
                    prev.includes(id)
                      ? prev.filter(l => l !== id)
                      : [...prev, id]
                  )}
                  deleteLabel={deleteLabel}
                  position={position}
                  ref={ref as React.RefObject<HTMLDivElement>}
                />
              )}
              customTitle={"Select labels"}
            />

            <CustomDropdown
              icon="filter-icon"
              options={options.status}
              value={statusFilter}
              onChange={setStatusFilter}
            />

            <CustomDropdown
              icon="filter-icon"
              options={options.priority}
              value={priorityFilter}
              onChange={setPriorityFilter}
            />

          </div>

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

            <select
              value={newPriority}
              className="add-task-selection"
              onChange={(e) => setNewPriority(e.target.value)}
            >
              <option value="high">High</option>
              <option value="mid">Mid</option>
              <option value="low">Low</option>
            </select>

            <button type="submit" className="task-button done">
              Add task
            </button>
          </form>

          <div className="section buttons">
            <div className="labels-select">
              <button
                type="button"
                ref={deleteLabelsButtonRef}
                className="button-delete"
                onClick={() => setDeleteLabelsOpen(prev => !prev)}

              >
                Delete labels
              </button>

              {deleteLabelsOpen && (
                <LabelsPanel
                  labels={actualLabelsList}
                  selectedIds={selectedLabels}
                  showDelete={true}
                  deleteLabel={deleteLabel}
                  position={deleteLabelsPos}
                  showCheckbox={false}
                  footer={
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmConfig({
                          action: deleteAllLabels,
                          title: "Delete all labels?",
                          message:
                            "All labels in this project will be permanently deleted.",
                        });
                        setDeleteLabelsOpen(false);
                      }}
                      className={`button-delete ${actualLabelsList.length === 0 ? "inactive" : ""
                        }`}
                      disabled={actualLabelsList.length === 0}
                    >
                      Delete All labels
                    </button>
                  }
                  ref={deleteLabelsRef}
                />
              )}
            </div>
            <button
              onClick={() =>
                setConfirmConfig({
                  action: deleteAllTasks,
                  title: "Delete all tasks?",
                  message:
                    "All tasks in this project will be permanently deleted.",
                })
              }
              className={`button-delete ${actualTasksList.length === 0 ? "inactive" : ""
                }`}
              disabled={actualTasksList.length === 0}
            >
              Delete all tasks
            </button>

          </div>
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
        <div className="section">

          <CustomDropdown
            value={null}
            options={[]}
            customPanel={({ close, position, ref }) => (
              <LabelsPanel
                labels={actualLabelsList}
                selectedIds={labelsFilter}
                onToggle={(id) => setLabelsFilter(prev =>
                  prev.includes(id)
                    ? prev.filter(l => l !== id)
                    : [...prev, id]
                )}
                deleteLabel={deleteLabel}
                position={position}
                ref={ref as React.RefObject<HTMLDivElement>}
              />
            )}
            customTitle={"Select labels"}
          />

          <CustomDropdown
            icon="filter-icon"
            options={options.status}
            value={statusFilter}
            onChange={setStatusFilter}
          />

          <CustomDropdown
            icon="filter-icon"
            options={options.priority}
            value={priorityFilter}
            onChange={setPriorityFilter}
          />
        </div>

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

        <div className="section buttons">
          <div className="labels-select">
            <button
              type="button"
              ref={deleteLabelsButtonRef}
              className="button-delete"
              onClick={() => setDeleteLabelsOpen(prev => !prev)}

            >
              Delete labels
            </button>

            {deleteLabelsOpen && (
              <LabelsPanel
                labels={actualLabelsList}
                selectedIds={selectedLabels}
                showDelete={true}
                deleteLabel={deleteLabel}
                position={deleteLabelsPos}
                showCheckbox={false}
                footer={
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmConfig({
                        action: deleteAllLabels,
                        title: "Delete all labels?",
                        message:
                          "All labels in this project will be permanently deleted.",
                      });
                      setDeleteLabelsOpen(false);
                    }}
                    className={`button-delete ${actualLabelsList.length === 0 ? "inactive" : ""
                      }`}
                    disabled={actualLabelsList.length === 0}
                  >
                    Delete All labels
                  </button>
                }
                ref={deleteLabelsRef}
              />
            )}
          </div>
          <button
            onClick={() =>
              setConfirmConfig({
                action: deleteAllTasks,
                title: "Delete all tasks?",
                message:
                  "All tasks in this project will be permanently deleted.",
              })
            }
            className={`button-delete ${actualTasksList.length === 0 ? "inactive" : ""
              }`}
            disabled={actualTasksList.length === 0}
          >
            Delete all tasks
          </button>
        </div>
      </div>
    </div>
  );
}

export default TopSection;


