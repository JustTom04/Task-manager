import React from "react";
import { createPortal } from "react-dom";
import Label from "./Label";

function LabelsPanel({ labels, selectedIds, setSelectedIds, onToggle, position, showDelete = false, deleteLabel, }) {

  console.log("POSITON:", position, "onTOGGEL", selectedIds)

  return createPortal(
    <div
      className="labels-dropdown dropdown"
      style={{
        position: "absolute",
        top: position?.top ?? 0,
        left: position?.left ?? 0,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {labels.map((label) => {
        const isChecked = selectedIds.includes(label.id);
        const inputId = `label-checkbox-${label.id}`;

        return (
          <div key={label.id} className="labels-item">
            <input
              id={inputId}
              type="checkbox"
              className="label-checkbox"
              checked={isChecked}
              onClick={(e) => e.stopPropagation()}
              onChange={() => {
                if (onToggle) {
                  onToggle(label.id);
                  return;
                }
                setSelectedIds((prev) =>
                  prev.includes(label.id)
                    ? prev.filter((id) => id !== label.id)
                    : [...prev, label.id]
                );
              }}
            />

            <label htmlFor={inputId} className="labels-main" onMouseDown={(e) => e.stopPropagation()}>
              <Label
                label={label}
                isSelected={isChecked}
                deleteLabel={() => deleteLabel?.(label.id)}
                showDelete={showDelete}
                marginRight={5}
              />
            </label>
          </div>
        );
      })}
    </div>,
    document.body
  );
}

export default LabelsPanel;