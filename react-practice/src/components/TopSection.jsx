import { useState, useRef } from "react";
import LabelsPanel from "./LabelsPanel";
import { useClickOutside, INPUT_LENGTH } from "../utils";

function TopSection({
  isMobile,
  taskState,
  labelState,
  filterState,
  projectData,
  setConfirmConfig,
  setShowLabelModal,
}) {
  // ===== Local UI state =====
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [filterLabelsOpen, setFilterLabelsOpen] = useState(false);

  // ===== Refs =====
  const labelsRef = useRef(null);
  const filterLabelsRef = useRef(null);

  useClickOutside(labelsRef, () => setLabelsOpen(false));
  useClickOutside(filterLabelsRef, () => setFilterLabelsOpen(false));

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


  // =====================================================
  // ===================== MOBILE ========================
  // =====================================================
  if (isMobile) {
    return (
      <div className="top-section">
        <div className="section-group">
          {/* ===== Filters ===== */}
          <div className="section">
            <div className="select-wrapper">
              <span className="filter-icon"></span>

              <div
                className="labels-select filter-select"
                ref={filterLabelsRef}
              >
                <button
                  type="button"
                  className="labels-button filter-labels-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilterLabelsOpen((prev) => !prev);
                  }}
                >
                  select labels
                </button>

                {filterLabelsOpen && (
                  <LabelsPanel
                    labels={actualLabelsList}
                    selectedIds={labelsFilter}
                    setSelectedIds={setLabelsFilter}
                    showDelete
                    deleteLabel={deleteLabel}
                  />
                )}
              </div>
            </div>

            <div className="select-wrapper">
              <span className="filter-icon"></span>

              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All status</option>
                <option value="Finished">Finished</option>
                <option value="On working">On working</option>
              </select>
            </div>

            <div className="select-wrapper">
              <span className="filter-icon"></span>

              <select
                className="filter-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="ALL">Any Priority</option>
                <option value="high">High</option>
                <option value="mid">Mid</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="section buttons">
            <div className="labels-select" ref={labelsRef}>
              <button
                type="button"
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
          <div className="select-wrapper">
            <span className="filter-icon"></span>

            <div className="labels-select filter-select " ref={filterLabelsRef}>
              <button
                type="button"
                className="labels-button filter-labels-button"
                onClick={() => setFilterLabelsOpen((prev) => !prev)}
              >
                select labels
              </button>

              {filterLabelsOpen && (
                <LabelsPanel
                  labels={actualLabelsList}
                  selectedIds={labelsFilter}
                  setSelectedIds={setLabelsFilter}
                  showDelete={true}
                  deleteLabel={deleteLabel}
                />
              )}
            </div>
          </div>

          <div className="select-wrapper">
            <span className="filter-icon"></span>

            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All status</option>
              <option value="Finished">Finished</option>
              <option value="On working">On working</option>
            </select>
          </div>

          <div className="select-wrapper">
            <span className="filter-icon"></span>
            <select
              className="filter-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="ALL">Any Priority</option>
              <option value="high">High</option>
              <option value="mid">Mid</option>
              <option value="low">Low</option>
            </select>
          </div>
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


