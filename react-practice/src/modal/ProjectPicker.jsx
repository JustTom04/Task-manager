import { useState } from "react";


function ProjectPicker({ onClose }) {
  const [name, setName] = useState("");

  function handleSave() {
    if (!name.trim()) return;
    onClose({ name });
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Create Project</h2>

        <input
          type="text"
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="modal-actions">
          <button className="task-button done" onClick={handleSave}>
            Save
          </button>
          <button className="task-button undone" onClick={() => onClose(null)}>
            Cancel
          </button>

        </div>
      </div>
    </div>
  );
}

export default ProjectPicker;
