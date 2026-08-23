import { useState, useEffect, useRef } from "react";
import { getFilteredTasks } from "@/backend/actions/taskActions";

export function useTaskFilterState({ activeProjectId, activeUserId, setProjects }) {
  const [labelsFilter, setLabelsFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Keep track of the latest request to prevent race conditions
  const latestRequestId = useRef(0);

  // Fetch filtered tasks from the backend whenever filters or active project changes
  useEffect(() => {
    if (!activeProjectId || !activeUserId) return;

    let isMounted = true;
    setIsLoadingTasks(true);

    const currentRequestId = ++latestRequestId.current;

    const filters = {
      status: statusFilter,
      priority: priorityFilter,
      labels: labelsFilter
    };

    getFilteredTasks(activeProjectId, filters, activeUserId)
      .then((fetchedTasks) => {
        if (!isMounted) return;
        
        // ONLY update if this response belongs to the most recently fired request
        if (currentRequestId !== latestRequestId.current) {
          console.log(`[NETWORK] Ignored stale response for request #${currentRequestId}`);
          return;
        }

        // Update the global projects state with the freshly filtered tasks
        setProjects((prev) =>
          prev.map((p) =>
            p.id === activeProjectId ? { ...p, tasks: fetchedTasks } : p
          )
        );
      })
      .catch((err) => {
        if (currentRequestId === latestRequestId.current) {
          console.error("❌ Error fetching filtered tasks:", err);
        }
      })
      .finally(() => {
        if (isMounted && currentRequestId === latestRequestId.current) {
          setIsLoadingTasks(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeProjectId, activeUserId, statusFilter, priorityFilter, labelsFilter, setProjects]);

  return {
    labelsFilter, setLabelsFilter,
    statusFilter, setStatusFilter,
    priorityFilter, setPriorityFilter,
    isLoadingTasks,
  };
}
