import React, { useState, useRef } from "react";
import LabelsPanel from "../LabelsPanel";
import { useClickOutside, useDropdownPosition } from "@/frontend/utils";
import useStore from "@/frontend/store/useStore";

export default function DeleteActions() {
  const setConfirmConfig = useStore(s => s.setConfirmConfig);
  const [deleteLabelsOpen, setDeleteLabelsOpen] = useState(false);
  const deleteLabelsRef = useRef<HTMLDivElement>(null);
  const deleteLabelsButtonRef = useRef<HTMLButtonElement>(null);

  useClickOutside(deleteLabelsRef, () => setDeleteLabelsOpen(false));
  const deleteLabelsPos = useDropdownPosition(deleteLabelsButtonRef, deleteLabelsOpen);

  const selectedLabels = useStore(s => s.selectedLabels);
  
  const projects = useStore(s => s.projects);
  const activeProjectId = useStore(s => s.activeProjectId);
  const actualProject = projects.find(p => p.id === activeProjectId);
  const actualTasksList = actualProject?.tasks || [];
  const actualLabelsList = actualProject?.labels || [];

  const _deleteLabel = useStore(s => s.deleteLabel);
  const _deleteAllLabels = useStore(s => s.deleteAllLabels);
  const deleteLabel = (id: string) => _deleteLabel(id);
  const deleteAllLabels = () => _deleteAllLabels();

  const _deleteAllTasks = useStore(s => s.deleteAllTasks);
  const deleteAllTasks = () => _deleteAllTasks();

  return (
    <>
      <div className="labels-select">
        <button
          type="button"
          ref={deleteLabelsButtonRef}
          className="button-delete"
          onClick={() => setDeleteLabelsOpen(prev => !prev)}
        >
          Delete labels
        </button>

        {deleteLabelsOpen && (
          <LabelsPanel
            labels={actualLabelsList}
            selectedIds={selectedLabels}
            showDelete={true}
            deleteLabel={deleteLabel}
            position={deleteLabelsPos}
            showCheckbox={false}
            footer={
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmConfig({
                    action: deleteAllLabels,
                    title: "Delete all labels?",
                    message:
                      "All labels in this project will be permanently deleted.",
                  });
                  setDeleteLabelsOpen(false);
                }}
                className={`button-delete ${actualLabelsList.length === 0 ? "inactive" : ""}`}
                disabled={actualLabelsList.length === 0}
              >
                Delete All labels
              </button>
            }
            ref={deleteLabelsRef}
          />
        )}
      </div>
      
      <button
        onClick={() =>
          setConfirmConfig({
            action: deleteAllTasks,
            title: "Delete all tasks?",
            message:
              "All tasks in this project will be permanently deleted.",
          })
        }
        className={`button-delete ${actualTasksList.length === 0 ? "inactive" : ""}`}
        disabled={actualTasksList.length === 0}
      >
        Delete all tasks
      </button>
    </>
  );
}
