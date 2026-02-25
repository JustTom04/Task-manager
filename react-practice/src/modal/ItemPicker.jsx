import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { INPUT_LENGTH } from "@/utils";

function ItemPicker({ onClose, title, inputMaxLength, includeColor = false }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#34a853");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSave() {
    if (!name.trim()) return;
    if (includeColor) {
      onClose({ name, color });
    } else {
      onClose({ name });
    }
  }

  return createPortal(
    <div className="modal-overlay">
      <div className="modal">
        <h2>{title}</h2>

        <input
          type="text"
          placeholder={`${title} name`}
          maxLength={inputMaxLength}
          value={name}
          ref={inputRef}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
          }}
        />

        {includeColor && (
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        )}

        <div className="modal-actions">
          <button className="task-button done" onClick={handleSave}>
            Save
          </button>
          <button className="task-button undone" onClick={() => onClose(null)}>
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ItemPicker;