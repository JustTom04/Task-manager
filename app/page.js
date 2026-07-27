"use client";

import { useState, useEffect, useRef } from "react";

import { useClickOutside, INPUT_LENGTH } from "@/frontend/utils";
import { useProjectState } from "@/frontend/hooks/useProjectState";

import Task from "@/frontend/components/Task";
import ItemPicker from "@/frontend/modals/ItemPicker";
import ConfirmModal from "@/frontend/modals/ConfirmModal";
import SettingsPanel from "@/frontend/components/SettingsPanel";
import TopSection from "@/frontend/components/TopSection";

import "@/frontend/styles/topSection.css";
import "@/frontend/styles/general.css";
import "@/frontend/styles/responsive.css";
import "@/frontend/styles/modal.css";
import "@/frontend/styles/label.css";
import "@/frontend/styles/settingsPanel.css";
import "@/frontend/styles/task.css";

export default function Home() {
  // ===== Mobile breakpoint =====
  const breakpoint = 668;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= breakpoint);
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ===== States =====
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [filterlabelsOpen, setFilterLabelsOpen] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState(null);

  // ===== Ref =====
  const labelsRef = useRef(null);
  const filterLabelsRef = useRef(null);

  // ===== Project State Hook =====
  const {
    projects,
    setProjects,
    activeProjectId,
    setActiveProjectId,
    addProject,
    deleteProject,
    renameProject,
    actualProject,
    actualTasksList,
    actualLabelsList,
    taskState,
    labelState,
    taskFilterState,
    deleteLabel,
    deleteAllLabels,
  } = useProjectState();

  // ===== Component States =====
  const {
    lastTaskRef,
    toggleTask,
    deleteTask,
    deleteTaskLabel,
    toggleLabelOnTask,
    updateTask,
  } = taskState;

  const { addLabelToProject } = labelState;
  const { filteredTasks } = taskFilterState;

  // ===== Completed tasks counter =====
  const completedCount = actualTasksList ? actualTasksList.filter((t) => t.done).length : 0;

  useClickOutside(labelsRef, () => setLabelsOpen(false));
  useClickOutside(filterLabelsRef, () => setFilterLabelsOpen(false));

  // Delayed loading screen (150ms) to prevent flicker
  useEffect(() => {
    let timer;
    if (!actualProject) {
      timer = setTimeout(() => setShowLoading(true), 150);
    } else {
      setShowLoading(false);
    }
    return () => clearTimeout(timer);
  }, [actualProject]);

  // Loading screen while projects load from Server Action
  if (!actualProject) {
    if (!showLoading) return null;
    return (
      <div className="app-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <h1 style={{ color: "white" }}>Loading data from server...</h1>
      </div>
    );
  }

  return (
    <div className="app-container">
      <span
        className={`settings-toggle ${settingsOpen ? "active" : ""}`}
        onClick={() => setSettingsOpen((prev) => !prev)}
      />

      <div id="title-row">
        <h1 id="title">{actualProject.name}</h1>
      </div>

      {/* ===== Top section ===== */}
      <TopSection
        isMobile={isMobile}
        taskState={taskState}
        filterState={taskFilterState}
        projectData={{
          actualLabelsList,
          actualTasksList,
          deleteLabel,
          deleteAllLabels,
        }}
        setConfirmConfig={setConfirmConfig}
        setShowLabelModal={setShowLabelModal}
      />

      <span id="completed-counter">
        Completed: {completedCount}/{actualTasksList.length}
      </span>

      {/* ===== Tasks list ===== */}
      <div className="task-list-container">
        {actualTasksList.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🎉</span>
            <p className="empty-state-text">
              You currently have no tasks. Sit back and relax, or create a new one!
            </p>
          </div>
        ) : filteredTasks && filteredTasks.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">No tasks match your current filters.</p>
          </div>
        ) : (
          filteredTasks &&
          filteredTasks.map((task, index) => {
            const isLast = index === filteredTasks.length - 1;
            return (
              <Task
                key={task.id}
                task={task}
                toggleTask={() => toggleTask(task.id)}
                deleteTask={() => deleteTask(task.id)}
                updateTask={(updatedTask) => updateTask(task.id, updatedTask)}
                deleteTaskLabel={deleteTaskLabel}
                toggleLabelOnTask={toggleLabelOnTask}
                allLabels={actualLabelsList}
                ref={isLast ? lastTaskRef : null}
              />
            );
          })
        )}
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
        renameProject={renameProject}
        addProject={addProject}
        isOpen={settingsOpen}
        setIsOpen={setSettingsOpen}
      />
    </div>
  );
}
