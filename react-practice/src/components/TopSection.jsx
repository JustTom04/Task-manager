import { useState, useRef } from "react";
import LabelsPanel from "./LabelsPanel";
import CustomDropdown from "./CustomDropdown";
import { useClickOutside, INPUT_LENGTH, useDropdownPosition } from "@/utils.js";

function TopSection({
  isMobile,
  taskState,
  labelState,
  filterState,
  projectData,
  setConfirmConfig,
  setShowLabelModal,
}) {
  // ===== Labels =====
  const [labelsOpen, setLabelsOpen] = useState(false);
  const labelsRef = useRef(null);
  useClickOutside(labelsRef, () => setLabelsOpen(false));

  const buttonRef = useRef(null);
  const dropdownPos = useDropdownPosition(buttonRef, labelsOpen);

  // ===== Destructure =====
  const {
    newTitle,
    setNewTitle,
    newPriority,
    setNewPriority,
    selectedLabels,
    setSelectedLabels,
    newTitleRef,
    addTask,
    deleteAllTasks,
  } = taskState;

  const { deleteLabel, deleteAllLabels } = labelState;

  const {
    labelsFilter,
    setLabelsFilter,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
  } = filterState;

  const { actualLabelsList, actualTasksList } = projectData;

  const options = {
    status: [
      { value: "ALL", label: "All status" },
      { value: "Finished", label: "Finished" },
      { value: "On working", label: "On working" },
    ],
    priority: [
      { value: "ALL", label: "Any Priority" },
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
            value={null}
            options={[]}
            customPanel={({ close, position }) => (
              <LabelsPanel
                labels={actualLabelsList}
                selectedIds={labelsFilter}
                setSelectedIds={setLabelsFilter}
                showDelete={true}
                deleteLabel={deleteLabel}
                position={position}
              />
            )}
            customTitle={"Select labels"}
          />

            <CustomDropdown
              options={options.status}
              value={statusFilter}
              onChange={setStatusFilter}
            />

            <CustomDropdown
              options={options.priority}
              value={priorityFilter}
              onChange={setPriorityFilter}
            /> 

          </div>

          <div className="section buttons">
            <div className="labels-select" ref={labelsRef}>
              <button
                type="button"
                ref={buttonRef}
                className="labels-button"
                onClick={() => setLabelsOpen((prev) => !prev)}
              >
                Add labels
              </button>

              {labelsOpen && (
                <LabelsPanel
                  labels={actualLabelsList}
                  selectedIds={selectedLabels}
                  setSelectedIds={setSelectedLabels}
                  position={dropdownPos}
                />
              )}
            </div>

            <button
              className="done"
              onClick={() => setShowLabelModal(true)}
            >
              ➕ Create Label
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
              Add Task
            </button>
          </form>

          <div className="section buttons">
            <button
              onClick={() =>
                setConfirmConfig({
                  action: deleteAllTasks,
                  title: "Delete all tasks?",
                  message:
                    "All tasks in this project will be permanently deleted.",
                })
              }
              className={`button-delete ${
                actualTasksList.length === 0 ? "inactive" : ""
              }`}
              disabled={actualTasksList.length === 0}
            >
              Delete All Tasks
            </button>

            <button
              onClick={() =>
                setConfirmConfig({
                  action: deleteAllLabels,
                  title: "Delete all labels?",
                  message:
                    "All labels in this project will be permanently deleted.",
                })
              }
              className={`button-delete ${
                actualLabelsList.length === 0 ? "inactive" : ""
              }`}
              disabled={actualLabelsList.length === 0}
            >
              Delete All labels
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
            customPanel={({ close, position }) => (
              <LabelsPanel
                labels={actualLabelsList}
                selectedIds={labelsFilter}
                setSelectedIds={setLabelsFilter}
                showDelete={true}
                deleteLabel={deleteLabel}
                position={position}
              />
            )}
            customTitle={"Select labels"}
          />

          <CustomDropdown
            options={options.status}
            value={statusFilter}
            onChange={setStatusFilter}
          />

          <CustomDropdown
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
            ➕ Create Label
          </button>
        </div>
        
      </div>

      <div className="section-group">
      {/* ===== Add new task ===== */}
        <form onSubmit={addTask} className="section form-container">
            <div className="labels-select" ref={labelsRef}>
              <button
                type="button"
                ref={buttonRef}
                className="labels-button"
                onClick={() => setLabelsOpen((prev) => !prev)}
              >
                Add labels
              </button>

              {labelsOpen && (
                  <LabelsPanel
                    labels={actualLabelsList}
                    selectedIds={selectedLabels}
                    setSelectedIds={setSelectedLabels}
                    showDelete={false}
                    position={dropdownPos}
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
              Add Task
            </button>
        </form>

        <div className="section buttons">
          <button
            onClick={() =>
              setConfirmConfig({
                action: deleteAllTasks,
                title: "Delete all tasks?",
                message: "All tasks in this project will be permanently deleted.",
              })
            }
            className={`button-delete ${
              actualTasksList.length === 0 ? "inactive" : ""
            }`}
            disabled={actualTasksList.length === 0}
          >
            Delete All tasks
          </button>

          <button
            onClick={() =>
              setConfirmConfig({
                action: deleteAllLabels,
                title: "Delete all labels?",
                message: "All labels in this project will be permanently deleted.",
              })
            }

            className={`button-delete ${
              actualLabelsList.length === 0 ? "inactive" : ""
            }`}
            disabled={actualLabelsList.length === 0}
          >
            Delete All labels
          </button>
        </div>
      </div>
    </div>
  );
}

export default TopSection;


