import { useState } from "react";
import "./colorPicker.css"; // újra felhasználjuk a modal stílust

function ProjectPicker({ onClose }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#34a853"); // opcionális szín

  function handleSave() {
    if (!name.trim()) return;
    onClose({ name, color });
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

        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />

        <div className="modal-actions">
          <button className="task-button undone" onClick={() => onClose(null)}>
            Cancel
          </button>
          <button className="task-button done" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProjectPicker;
