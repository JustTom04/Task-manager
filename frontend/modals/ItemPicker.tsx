import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { INPUT_LENGTH } from "@/frontend/utils";

export interface ItemPickerResult {
  name: string;
  color?: string;
}

interface ItemPickerProps {
  onClose: (result: ItemPickerResult | null) => void;
  title: string;
  inputMaxLength: number;
  includeColor?: boolean;
  initialName?: string;
  existingNames?: string[];
}

function ItemPicker({ onClose, title, inputMaxLength, includeColor = false, initialName = "", existingNames = [] }: ItemPickerProps) {
  
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState("#34a853");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const lowerCaseName = trimmedName.toLowerCase();
    const isDuplicate = existingNames.some(existing => existing.toLowerCase() === lowerCaseName);

    if (isDuplicate) {
      setError("This name is already taken.");
      return;
    }

    if (includeColor) {
      onClose({ name: trimmedName, color });
    } else {
      onClose({ name: trimmedName });
    }
  }

  // ===== Return JSX =====
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
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
          }}
        />

        {error && (
          <div className="auth-error-box" style={{ marginBottom: "15px" }}>
            <span className="auth-error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

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