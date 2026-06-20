import { useState, useRef, useEffect } from "react";

import { INPUT_LENGTH, useClickOutside } from "../utils.js";

import ItemPicker from "../modals/ItemPicker.jsx";
import ConfirmModal from "../modals/ConfirmModal.jsx";



function SettingsPanel({
  projects,
  activeProjectId,
  onSelectProject,
  deleteProject,
  renameProject,
  addProject,
  isOpen,
  setIsOpen
}) {
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [confirmConfig, setConfirmConfig] = useState(null);

  const editInputRef = useRef(null);
  const settingsRef = useRef(null);

  useClickOutside(settingsRef, () => { setIsOpen(false) })

  // Focus input automatically when editing starts
  useEffect(() => {
    if (editingProjectId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingProjectId]);

  const handleEditSubmit = (projectId, oldName) => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== oldName) {
      renameProject(projectId, trimmed);
    }
    setEditingProjectId(null);
  };

  const startEditing = (p) => {
    if (p.name !== "General") {
      setEditingProjectId(p.id);
      setEditValue(p.name);
    }
  };

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
            onDoubleClick={() => startEditing(p)}
          >
            {editingProjectId === p.id ? (
              <input
                ref={editInputRef}
                type="text"
                value={editValue}
                maxLength={INPUT_LENGTH.PROJECT_NAME}
                className="project-item-title"
                style={{
                  width: "100%",
                  background: "var(--color-task-bg)",
                  border: "1px solid white",
                  color: "var(--color-text)",
                  outline: "none",
                  padding: "2px 6px",
                  borderRadius: "6px",
                  marginRight: "10px"
                }}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleEditSubmit(p.id, p.name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleEditSubmit(p.id, p.name);
                  }
                  if (e.key === "Escape") {
                    setEditingProjectId(null);
                  }
                }}
              />
            ) : (
              <div className="project-item-title" style={{ cursor: p.name !== "General" ? "text" : "default" }}>
                {p.name}
              </div>
            )}

            <div style={{ display: "flex", gap: "5px" }}>
              {p.name !== "General" && (
                <button className="remove-button medium" style={{ backgroundColor: editingProjectId === p.id ? "var(--color-success)" : "#4f46e5" }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault(); // Prevents input from losing focus if we want, or just let it fire before blur
                    if (editingProjectId === p.id) {
                      handleEditSubmit(p.id, p.name);
                    } else {
                      startEditing(p);
                    }
                  }}
                  title={editingProjectId === p.id ? "Save" : "Rename"}
                >
                  {editingProjectId === p.id ? "💾" : "✏️"}
                </button>
              )}
              <button className="remove-button medium" style={{ backgroundColor: editingProjectId === p.id ? "var(--color-muted)" : "" }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (editingProjectId === p.id) {
                    setEditingProjectId(null);
                  } else {
                    setConfirmConfig({
                      title: "Delete project?",
                      message: `Project "${p.name}" will be permanently deleted.`,
                      action: () => deleteProject(p.id),
                    });
                  }
                }}
                title={editingProjectId === p.id ? "Cancel" : "Delete"}
              >
                {editingProjectId === p.id ? "✖️" : "❌"}
              </button>
            </div>
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
