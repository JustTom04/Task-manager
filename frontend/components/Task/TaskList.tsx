import React, { useState, useEffect, useRef, useMemo } from "react";
import { AnimatePresence, Reorder } from "framer-motion";
import Task from "./index";
import useStore, { FrontendTask } from "@/frontend/store/useStore";

interface TaskListProps {
  tasks: FrontendTask[];
}

export default function TaskList({ tasks }: TaskListProps) {
  const [localTasks, setLocalTasks] = useState(tasks);
  const seenTaskIds = useRef(new Set<string>());
  const listRef = useRef<HTMLUListElement>(null);
  const lastTaskRef = useRef<HTMLDivElement>(null);

  const reorderTasks = useStore((s) => s.reorderTasks);
  const draggingTaskId = useStore((s) => s.draggingTaskId);
  const setDraggingTaskId = useStore((s) => s.setDraggingTaskId);

  // Mark all currently rendered tasks as seen so new tasks can have fadeIn animation
  useEffect(() => {
    localTasks.forEach(task => seenTaskIds.current.add(task.id));
  }, [localTasks]);

  // Keep local list in sync with store tasks when not actively dragging
  useEffect(() => {
    if (!draggingTaskId) {
      setLocalTasks(tasks);
    }
  }, [tasks, draggingTaskId]);

  const localTaskIds = useMemo(() => localTasks.map(t => t.id), [localTasks]);

  return (
    <Reorder.Group
      ref={listRef}
      axis="y"
      values={localTaskIds}
      onReorder={(newIds) => {
        const reordered = newIds
          .map(id => localTasks.find(t => t.id === id))
          .filter(Boolean) as FrontendTask[];
        setLocalTasks(reordered);
      }}
      style={{
        position: "relative",
        listStyleType: "none",
        padding: 0,
        margin: 0,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "8px"
      }}
    >
      <AnimatePresence mode="popLayout">
        {localTasks.map((task, index) => {
          const isLast = index === localTasks.length - 1;
          const isNew = !seenTaskIds.current.has(task.id);
          return (
            <Task
              key={task.id}
              task={task}
              isNew={isNew}
              isLast={isLast}
              listRef={listRef}
              ref={isLast ? lastTaskRef : null}
              onDragEnd={() => {
                reorderTasks(localTasks);
                setDraggingTaskId(null);
              }}
            />
          );
        })}
      </AnimatePresence>
    </Reorder.Group>
  );
}
