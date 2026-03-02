import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Task from "./components/Task.jsx"
import LabelsPanel from "./components/LabelsPanel.jsx";
import ItemPicker from "./modal/ItemPicker.jsx";

import ConfirmModal from "./modal/ConfirmModal.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";
import TopSection from "./components/TopSection.jsx";

import { useClickOutside, INPUT_LENGTH } from "./utils.js";

import { useProjectState } from "./hooks/useProjectState.js";

import "./styles/topSection.css"
import "./styles/general.css";
import "./styles/responsive.css"
import "./styles/modal.css";
import "./styles/label.css";
import "./styles/settingsPanel.css";
import "./styles/task.css";



function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ===== States =====
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [filterlabelsOpen, setFilterLabelsOpen] = useState(false);

  const [showLabelModal, setShowLabelModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const [settingsOpen, setSettingsOpen] = useState(false);


  // ===== Ref =====
  const labelsRef = useRef(null);
  const filterLabelsRef = useRef(null);


  // ===== Project State =====
  const {
    projects,setProjects,
    activeProjectId, setActiveProjectId,
    addProject,
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
    toggleLabelOnTask,
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
        className={`settings-toggle ${settingsOpen ? "active" : ""}`}
        onClick={() => setSettingsOpen(prev => !prev)}
      >
      </span>

      <span id="completed-counter">
        Completed: {completedCount}/{actualTasksList.length}
      </span>
      <div id="title-row">
        <h1 id="title">{actualProject.name}</h1>
      </div>

      {/* ===== Top section ===== */}
      <TopSection
        isMobile={isMobile}
        taskState={taskState}
        labelState={labelState}
        filterState={taskFilterState}
        projectData={{
          actualLabelsList,
          actualTasksList
        }}
        setConfirmConfig={setConfirmConfig}
        setShowLabelModal={setShowLabelModal}
      />
      

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
              toggleLabelOnTask={toggleLabelOnTask} 
              allLabels={actualLabelsList}
              ref={isLast ? lastTaskRef : null}
            />
          );
        })}
      </div>

      {showLabelModal && (
        <ItemPicker
          title="Create Label"
          inputMaxLength={INPUT_LENGTH.LABEL_NAME}
          includeColor={true}
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
        addProject={addProject}
        isOpen={settingsOpen}
        setIsOpen={setSettingsOpen}
      />

    </div>
  );
}

export default App;
