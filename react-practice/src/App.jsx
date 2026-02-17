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
import "./styles/responsive.css"
import "./styles/modal.css";
import "./styles/label.css";
import "./styles/settingsPanel.css";



function App() {
  // ===== States =====
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [filterlabelsOpen, setFilterLabelsOpen] = useState(false);

  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const [settingsOpen, setSettingsOpen] = useState(false);


  // ===== Ref =====
  const labelsRef = useRef(null);
  const filterLabelsRef = useRef(null);


  // ===== Project State =====
  const {
    projects,setProjects,
    activeProjectId, setActiveProjectId,
    deleteProject,
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
    deleteTaskLabel,
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
      <span
        className="settings-toggle"
        onClick={() => setSettingsOpen(prev => !prev)}
      >
      </span>

      <div id="title-row">
        <span id="completed-counter">
          Completed: {completedCount}/{actualTasksList.length}
        </span>
        <h1 id="title">{actualProject.name}</h1>


      </div>

      {/* ===== Top section ===== */}
      <div className="top-section">
        <div className="row">
          
          {/* ===== Filters ===== */}
          <div className="section">
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

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Status</option>
              <option value="Finished">Finished</option>
              <option value="On working">On working</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="ALL">Priority</option>
              <option value="high">High</option>
              <option value="mid">Mid</option>
              <option value="low">Low</option>
            </select>
          </div>


          <div className="section buttons">
            <button
              className="done"
              onClick={() => setShowLabelModal(true)}
            >
              ➕ Create Label
            </button>

            <button
              className="done"
              onClick={() => setShowProjectModal(true)}
            >
              ➕ Add Project
            </button>
          </div>
          
        </div>

        <div className="row">
        {/* ===== Add new task ===== */}
          <form onSubmit={addTask} className="section">
            <div className="form-container">
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
            
            </div>
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
              Delete All
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
              deleteTaskLabel={deleteTaskLabel}
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

      {confirmConfig && (
        <ConfirmModal
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={confirmConfig.action}
          onCancel={() => setConfirmConfig(null)}
        />
      )}

      <SettingsPanel
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={setActiveProjectId}
        deleteProject={deleteProject}
        isOpen={settingsOpen}
      />

    </div>
  );
}

export default App;
