import React, { forwardRef, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import Label from "./Label";
import { FrontendLabel } from "../store/useStore";

interface LabelsPanelProps {
  labels: FrontendLabel[];
  selectedIds: string[];
  onToggle?: (id: string) => void;
  position?: { top: number; left: number } | null;
  showDelete?: boolean;
  showCheckbox?: boolean;
  deleteLabel?: (id: string) => void;
  footer?: React.ReactNode;
  onClose?: () => void;
}

const LabelsPanel = forwardRef<HTMLDivElement, LabelsPanelProps>(({
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
  onClose,
}, ref) => {
  const internalPanelRef = useRef<HTMLDivElement | null>(null);

  // Focus the first interactive item when the panel opens (or if focus was lost after deleting a label)
  useEffect(() => {
    const panel = internalPanelRef.current;
    if (!panel) return;
    if (!panel.contains(document.activeElement)) {
      const items = panel.querySelectorAll<HTMLElement>("input, button:not(:disabled)");
      if (items.length > 0) {
        items[0].focus();
      }
    }
  }, [labels.length]);

  return createPortal(
    <div
      ref={(node) => {
        internalPanelRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      }}
      className="labels-dropdown dropdown"
      role="group"
      aria-label="Labels"
      style={{
        position: "absolute",
        top: position?.top ?? 0,
        left: position?.left ?? 0,
      }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          e.stopPropagation();
          const items = Array.from(
            e.currentTarget.querySelectorAll<HTMLElement>("input, button:not(:disabled)")
          );
          if (items.length === 0) return;
          const currentIndex = items.indexOf(document.activeElement as HTMLElement);
          const nextIndex = e.key === "ArrowDown"
            ? (currentIndex < items.length - 1 ? currentIndex + 1 : 0)
            : (currentIndex > 0 ? currentIndex - 1 : items.length - 1);
          items[nextIndex].focus();
        } else if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          onClose?.();
        } else if (e.key === "Tab") {
          onClose?.();
        }
      }}
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
                aria-label={label.name}
                onClick={(e) => e.stopPropagation()}
                onChange={() => onToggle?.(label.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggle?.(label.id);
                  }
                }}
              />
            )}

            <label
              htmlFor={showCheckbox ? inputId : undefined}
              className="labels-main"
            >
              <Label
                label={label}
                isSelected={isChecked}
                deleteLabel={() => deleteLabel?.(label.id)}
                showDelete={showDelete}
                deleteTooltip="Delete"
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