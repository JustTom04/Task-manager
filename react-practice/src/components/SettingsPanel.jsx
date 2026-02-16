
function SettingsPanel({ projects, activeProjectId, onSelectProject, deleteProject }) {
  return (
    <div className="settings-panel">
      <h2 className="settings-title">Projects</h2>
      <div className="projects-list">
        {projects.map((p) => (
          <div
            key={p.id}
            className={`project-item ${p.id === activeProjectId ? "active" : ""}`}
            onClick={() => onSelectProject(p.id)}
          >
            <div>{p.name}</div>
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
    </div>
  );
}

export default SettingsPanel;
