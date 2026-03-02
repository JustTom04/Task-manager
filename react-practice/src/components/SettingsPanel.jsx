import { useState, useRef } from "react";

import { INPUT_LENGTH, useClickOutside } from "../utils.js";

import ItemPicker from "../modal/ItemPicker.jsx";
import ConfirmModal from "../modal/ConfirmModal.jsx";



function SettingsPanel({ 
  projects,
  activeProjectId,
  onSelectProject,
  deleteProject, 
  addProject, 
  isOpen, 
  setIsOpen 
}) {
  
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const settingsRef = useRef(null);
  useClickOutside(settingsRef, () => { setIsOpen(false) })

  return (
    <div className={`settings-panel ${isOpen ? "open" : ""}`} ref={settingsRef} >
      <h2 className="settings-title">Projects</h2>
      <div className="projects-list">
        <button
          className="done add-project-button"
          onClick={() => setShowProjectModal(true)}
        >
          ➕ Add Project
        </button>
        {projects.map((p) => (
          <div
            key={p.id}
            className={`project-item ${p.id === activeProjectId ? "active" : ""}`}
            onClick={() => onSelectProject(p.id)}
          >
            <div className="project-item-title">{p.name}</div>
            <button className="remove-button medium" 
              onClick={(e) => {
                e.stopPropagation();
                setConfirmConfig({
                  title: "Delete project?",
                  message: `Project "${p.name}" will be permanently deleted.`,
                  action: () => deleteProject(p.id),
                });
              }}
            >
              ❌
            </button>
          </div>
        ))}

      </div>


      {showProjectModal && (
        <ItemPicker
          title="Create Project"
          inputMaxLength={INPUT_LENGTH.PROJECT_NAME}
          includeColor={false}
          onClose={(result) => {
            setShowProjectModal(false);
            if (result?.name) {
              addProject(result.name);
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
    </div>
  );
}

export default SettingsPanel;
