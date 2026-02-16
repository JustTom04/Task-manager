import React from "react";

function Label({ label, showDelete = false, deleteLabel }) {
  return (
    <div className="label-item">
      <span
        className="label"
        style={{ backgroundColor: label.color }}
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
