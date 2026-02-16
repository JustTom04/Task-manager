import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Task from "./components/Task.jsx"
import LabelsPanel from "./components/LabelsPanel.jsx";
import ColorPicker from "./modal/LabelPicker.jsx";
import ProjectPicker from "./modal/ProjectPicker.jsx";
import ConfirmModal from "./modal/ConfirmModal.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";

import { useClickOutside } from "./utils.js";

import { useProjectState } from "./hooks/useProjectState.js";

import "./styles/styles.css"
import "./styles/general.css";
import "./styles/modal.css";
import "./styles/label.css";
import "./styles/settingsPanel.css";



function App() {
  // ===== States =====
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [filterlabelsOpen, setFilterLabelsOpen] = useState(false);

  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // ===== Ref =====
  const labelsRef = useRef(null);
  const filterLabelsRef = useRef(null);


  // ===== Project & Task & Label State =====
  const {
    projects,setProjects,
    activeProjectId, setActiveProjectId,
    actualProject,
    actualTasksList,
    actualLabelsList,
    taskState,
    labelState,
    taskFilterState
  } = useProjectState();


  // ===== Components States =====
  const {
    newTitle, setNewTitle,
    newPriority, setNewPriority,
    selectedLabels, setSelectedLabels,
    newTitleRef,
    lastTaskRef,
    addTask,
    toggleTask,
    deleteTask,
    updateTask,
    deleteAllTasks
  } = taskState;

  const {deleteLabel, deleteAllLabels, addLabelToProject} = labelState;

  const { 
    labelsFilter, setLabelsFilter,
    statusFilter, setStatusFilter,
    priorityFilter, setPriorityFilter,
    filteredTasks,
  } = taskFilterState;


  // ===== Completed tasks counter =====
  const completedCount = actualTasksList.filter((t) => t.done).length;

  useClickOutside(labelsRef, () => setLabelsOpen(false));
  useClickOutside(filterLabelsRef, () => setFilterLabelsOpen(false));


  return (
    <div className="app-container">
      <div id="title-row">
        <h1 id="title">{actualProject.name}</h1>

        <span id="completed-counter">
          Completed: {completedCount}/{actualTasksList.length}
        </span>
      </div>

      {/* ===== Top section ===== */}
      <div className="top-section">
        <div className="row">
          
          {/* ===== Filters ===== */}
          <div className="section">
            <label>Status: </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="Finished">Finished</option>
              <option value="On working">On working</option>
            </select>

            <label>Priority: </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="high">High</option>
              <option value="mid">Mid</option>
              <option value="low">Low</option>
            </select>

            <div className="labels-select" ref={filterLabelsRef}>
              <button
                type="button"
                className="labels-button"
                id="filter-labels-button"
                onClick={() => setFilterLabelsOpen((prev) => !prev)}
              >
                select labels
              </button>

              {filterlabelsOpen && (
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


          <div className="section">
            <button
              className="task-button done"
              onClick={() => setShowLabelModal(true)}
            >
              ➕ Create Label
            </button>

            <button
              className="task-button done"
              onClick={() => setShowProjectModal(true)}
            >
              ➕ Add Project
            </button>
          </div>

        </div>

        <div className="row">
        {/* ===== Add new task ===== */}
          <form onSubmit={addTask} className="section">
            <input
              type="text"
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

            <button type="submit" className="task-button done">
              Add Task
            </button>
          </form>

          <div className="section">
            <button
              onClick={() =>
                setConfirmAction(() => deleteAllTasks)
              }
                className={`button-delete ${
                  actualTasksList.length === 0 ? "inactive" : ""
                }`}
                disabled={actualTasksList.length === 0}
            >
              Delete All
            </button>

            <button
              onClick={() =>
                setConfirmAction(() => deleteAllLabels)
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

      {/* ===== Tasks list ===== */}
      <div className="task-list-container">
        {filteredTasks.map((task, index) => {
          const isLast = index === filteredTasks.length - 1;
          return (
            <Task
              key={task.id}
              task={task}
              toggleTask={() => toggleTask(task.id)}
              deleteTask={() => deleteTask(task.id)}
              updateTask={(updatedTask) =>
                updateTask(task.id, updatedTask)
              }
              allLabels={actualLabelsList}
              ref={isLast ? lastTaskRef : null}
            />
          );
        })}
      </div>

      {showLabelModal && (
        <ColorPicker
          onClose={(result) => {
            setShowLabelModal(false);
            if (result) {
              addLabelToProject({
                id: crypto.randomUUID(),
                name: result.name,
                color: result.color,
              });
            }
          }}
        />
      )}

      {showProjectModal && (
        <ProjectPicker
          onClose={(result) => {
            setShowProjectModal(false);
            if (result) {
              const generalLabels = projects[0]?.labels || [];
              const newProject = {
                id: crypto.randomUUID(),
                name: result.name,
                tasks: [],
                labels: generalLabels.map((l) => ({ ...l })),
              };
              setProjects((prev) => [...prev, newProject]);
              setActiveProjectId(newProject.id);
            }
          }}
        />
      )}

      {confirmAction && (
        <ConfirmModal
          title="Are you sure?"
          message="This action cannot be undone."
          onConfirm={confirmAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      <SettingsPanel
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={setActiveProjectId}
      />

    </div>
  );
}

export default App;
