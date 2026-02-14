
function SettingsPanel({ projects, activeProjectId, onSelectProject }) {
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
            {p.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SettingsPanel;
