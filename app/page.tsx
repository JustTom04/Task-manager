"use client";

import { useState, useEffect, useRef } from "react";

import { useClickOutside, INPUT_LENGTH, getUserId } from "@/frontend/utils";
import useStore from "@/frontend/store/useStore";
import { useSession } from "next-auth/react";

import Task from "@/frontend/components/Task";
import ItemPicker from "@/frontend/modals/ItemPicker";
import ConfirmModal from "@/frontend/modals/ConfirmModal";
import SettingsPanel from "@/frontend/components/SettingsPanel";
import TopSection from "@/frontend/components/TopSection";

import "@/frontend/styles/components/topSection.css";
import "@/frontend/styles/base/general.css";
import "@/frontend/styles/base/responsive.css";
import "@/frontend/styles/modals/modal.css";
import "@/frontend/styles/modals/label.css";
import "@/frontend/styles/components/settingsPanel.css";
import "@/frontend/styles/components/task.css";

export default function Home() {
  const { data: session, status } = useSession();
  const activeUserId = session?.user?.id || getUserId();

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
  const lastTaskRef = useRef(null);

  const fetchProjects = useStore((state) => state.fetchProjects);
  const projects = useStore((state) => state.projects);
  const statusFilter = useStore((state) => state.statusFilter);
  const priorityFilter = useStore((state) => state.priorityFilter);
  const labelsFilter = useStore((state) => state.labelsFilter);

  const activeProjectId = useStore((state) => state.activeProjectId);
  const actualProject = projects.find(p => p.id === activeProjectId);
  const rawTasksList = actualProject?.tasks || [];
  
  const actualTasksList = rawTasksList.filter(task => {
    if (statusFilter === "Finished" && !task.done) return false;
    if (statusFilter === "On working" && task.done) return false;
    if (priorityFilter && priorityFilter !== "ALL" && task.priority.toLowerCase() !== priorityFilter.toLowerCase()) return false;
    if (labelsFilter && labelsFilter.length > 0) {
      if (!task.labels.some(lId => labelsFilter.includes(lId))) return false;
    }
    return true;
  });

  const actualLabelsList = actualProject?.labels || [];
  
  const _addLabelToProject = useStore((state) => state.addLabelToProject);
  const addLabelToProject = (label) => _addLabelToProject(label, activeUserId);

  const isLoadingTasks = useStore((state) => state.isLoadingTasks);

  // Fetch initial projects from Server
  useEffect(() => {
    if (status !== "loading") {
      fetchProjects(activeUserId);
    }
  }, [status, activeUserId, fetchProjects]);

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
        setConfirmConfig={setConfirmConfig}
        setShowLabelModal={setShowLabelModal}
        activeUserId={activeUserId}
      />

      <span id="completed-counter">
        Completed: {completedCount}/{actualTasksList.length}
      </span>

      <div className="task-list-container">
        {actualTasksList.length === 0 && !isLoadingTasks && (statusFilter === 'ALL' && priorityFilter === 'ALL' && labelsFilter.length === 0) ? (
          <div className="empty-state">
            <span className="empty-state-icon">🎉</span>
            <p className="empty-state-text">
              You currently have no tasks. Sit back and relax, or create a new one!
            </p>
          </div>
        ) : isLoadingTasks ? (
          <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <div className="loading-spinner" style={{
              width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)',
              borderTopColor: '#ff2c55', borderRadius: '50%', animation: 'spin 1s linear infinite'
            }} />
            <p className="empty-state-text" style={{ margin: 0 }}>Filtering tasks...</p>
            <style>{`
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
          </div>
        ) : actualTasksList && actualTasksList.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">No tasks match your current filters.</p>
          </div>
        ) : (
          actualTasksList &&
          actualTasksList.map((task, index) => {
            const isLast = index === actualTasksList.length - 1;
            return (
              <Task
                key={task.id}
                task={task}
                activeUserId={activeUserId}
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
          existingNames={actualLabelsList.map(l => l.name)}
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
          isOpen={settingsOpen}
          setIsOpen={setSettingsOpen}
          activeUserId={activeUserId}
        />
    </div>
  );
}
