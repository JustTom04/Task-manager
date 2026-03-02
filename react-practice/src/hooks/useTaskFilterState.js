import { useState, useMemo } from "react";

export function useTaskFilterState({ actualTasksList }) {
  const [labelsFilter, setLabelsFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

// ===== Filtered tasks =====  
  const filteredTasks = useMemo(() => {
    return actualTasksList.filter((task) => {
      const statusMatch =
        statusFilter === "ALL" ||
        (statusFilter === "Finished" && task.done) ||
        (statusFilter === "On working" && !task.done);

      const priorityMatch =
        priorityFilter === "ALL" ||
        task.priority.toLowerCase() === priorityFilter.toLowerCase();

      const labelsMatch =
        labelsFilter.length === 0 ||
        task.labels.some((labelId) => labelsFilter.includes(labelId));

      return statusMatch && priorityMatch && labelsMatch;
    });
  }, [actualTasksList, statusFilter, priorityFilter, labelsFilter]);

  return {
    labelsFilter, setLabelsFilter,
    statusFilter, setStatusFilter,
    priorityFilter, setPriorityFilter,
    filteredTasks,
  };
}
