import React from "react";
import CustomDropdown from "../CustomDropdown";
import LabelsPanel from "../LabelsPanel";
import useStore from "@/frontend/store/useStore";
import { DROPDOWN_OPTIONS } from "@/frontend/constants";

export default function FiltersBar() {
  const labelsFilter = useStore((s) => s.labelsFilter);
  const setLabelsFilter = useStore((s) => s.setLabelsFilter);
  const statusFilter = useStore((s) => s.statusFilter);
  const setStatusFilter = useStore((s) => s.setStatusFilter);
  const priorityFilter = useStore((s) => s.priorityFilter);
  const setPriorityFilter = useStore((s) => s.setPriorityFilter);
  const _deleteLabel = useStore((s) => s.deleteLabel);

  const projects = useStore((s) => s.projects);
  const activeProjectId = useStore((s) => s.activeProjectId);
  const actualProject = projects.find((p) => p.id === activeProjectId);
  const actualLabelsList = actualProject?.labels || [];

  const deleteLabel = (id: string) => _deleteLabel(id);

  return (
    <>
      <CustomDropdown
        icon="filter-icon"
        value={null}
        options={[]}
        customPanel={({ close, position, ref }) => (
          <LabelsPanel
            labels={actualLabelsList}
            selectedIds={labelsFilter}
            onToggle={(id) =>
              setLabelsFilter((prev) =>
                prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
              )
            }
            deleteLabel={deleteLabel}
            position={position}
            ref={ref as React.RefObject<HTMLDivElement>}
          />
        )}
        customTitle={"Select labels"}
      />

      <CustomDropdown
        icon="filter-icon"
        options={DROPDOWN_OPTIONS.STATUS_FILTER}
        value={statusFilter}
        onChange={setStatusFilter}
      />

      <CustomDropdown
        icon="filter-icon"
        options={DROPDOWN_OPTIONS.PRIORITY_FILTER}
        value={priorityFilter}
        onChange={setPriorityFilter}
      />
    </>
  );
}
