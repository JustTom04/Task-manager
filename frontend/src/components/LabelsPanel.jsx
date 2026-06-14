import React, { forwardRef } from "react";
import { createPortal } from "react-dom";

import Label from "./Label";


const LabelsPanel = forwardRef(({
  // ===== Required / core data =====
  labels,
  selectedIds,
  onToggle,
  position,

  // ===== Options / state =====
  showDelete = false,
  showCheckbox = true,

  // ===== Callbacks / extra features =====
  deleteLabel,
  footer,
}, ref) => {
  
  return createPortal(
    <div
      ref={ref}
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
            {showCheckbox && (
              <input
                id={inputId}
                type="checkbox"
                className="label-checkbox"
                checked={isChecked}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onChange={() => onToggle?.(label.id)}
              />
            )}

            <label
              htmlFor={inputId}
              className="labels-main"
              onMouseDown={(e) => e.stopPropagation()}
            >
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

      {footer && <div className="labels-footer">{footer}</div>}
    </div>,
    document.body
  );
});

export default LabelsPanel;