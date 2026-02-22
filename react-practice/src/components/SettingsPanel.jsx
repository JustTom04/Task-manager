import { useState } from "react";

import ProjectPicker from "../modal/ProjectPicker.jsx";


function SettingsPanel({ projects, activeProjectId, onSelectProject, deleteProject, addProject, isOpen }) {
  const [showProjectModal, setShowProjectModal] = useState(false);

  return (
    <div className={`settings-panel ${isOpen ? "open" : ""}`}>
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
            <button className="remove-button small" 
              onClick={(e) => {
                  e.stopPropagation(); 
                  deleteProject(p.id);
                }}
            >
              ❌
            </button>
          </div>
        ))}

      </div>


      {showProjectModal && (
        <ProjectPicker
          onClose={(result) => {
            setShowProjectModal(false);
            if (result?.name) {
              addProject(result.name);
            }
          }}
        />
      )}
    </div>
  );
}

export default SettingsPanel;
