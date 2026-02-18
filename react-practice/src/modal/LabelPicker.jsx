import { INPUT_LENGTH } from "@/utils";
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
          maxLength={INPUT_LENGTH.LABEL_NAME}
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

export default LabelPicker;
