import { useState } from "react";

function LabelPicker({ onClose }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#34a853");

  function handleSave() {
    if (!name.trim()) return;
    onClose({ name, color });
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Create Label</h2>

        <input
          type="text"
          placeholder="Label name"
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

export default LabelPicker;
