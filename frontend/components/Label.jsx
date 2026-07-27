import React from "react";

function Label({ label, isSelected = false, showDelete = false, deleteLabel, marginRight = 0 }) {
  return (
    <div
      className={`label-item ${isSelected ? "selected" : ""}`}
    >
      <span
        className="label"
        style={{
          backgroundColor: label.color,
          opacity: isSelected ? 1 : 0.6,
          transform: isSelected ? "scale(1.05)" : "scale(1)",
          marginRight: marginRight
        }}
      >
        {label.name}
      </span>
      {showDelete && deleteLabel && (
        <button onClick={deleteLabel} className="remove-button small">
          ❌
        </button>
      )}
    </div>
  );
}

export default Label;