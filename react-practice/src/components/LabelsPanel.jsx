import React from "react";
import Label from "./Label";

function LabelsPanel({ labels, selectedIds, setSelectedIds, showDelete = false, deleteLabel }) {
  return (
    <div className="labels-dropdown">
      {labels.map((label) => (
        <label key={label.id} className="labels-item">
          <input
            type="checkbox"
            checked={selectedIds.includes(label.id)}
            onChange={() => {
              setSelectedIds((prev) =>
                prev.includes(label.id)
                  ? prev.filter((id) => id !== label.id)
                  : [...prev, label.id]
              );
            }}
          />
          <Label
            label={label}
            deleteLabel={() => deleteLabel(label.id)}
            showDelete={showDelete}
          />
        </label>
      ))}
    </div>
  );
}

export default LabelsPanel;
