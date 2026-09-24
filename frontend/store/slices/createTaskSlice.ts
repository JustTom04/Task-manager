import { StateCreator } from 'zustand';
import { AppState, TaskSlice, FrontendTask } from '../types';
import { INPUT_LENGTH } from '@/frontend/constants';
import { createTask, updateTask as updateTaskAction, deleteTask as deleteTaskAction, deleteAllTasks as deleteAllTasksAction } from "@/backend/actions/taskActions";

export const createTaskSlice: StateCreator<AppState, [], [], TaskSlice> = (set, get) => ({
  newTitle: "",
  newPriority: "mid",
  statusFilter: "ALL",
  priorityFilter: "ALL",
  isLoadingTasks: false,
  draggingTaskId: null,

  setNewTitle: (val) => set({ newTitle: typeof val === 'function' ? val(get().newTitle) : val }),
  setNewPriority: (val) => set({ newPriority: typeof val === 'function' ? val(get().newPriority) : val }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  setPriorityFilter: (filter) => set({ priorityFilter: filter }),
  setIsLoadingTasks: (loading) => set({ isLoadingTasks: loading }),
  setDraggingTaskId: (id) => set({ draggingTaskId: id }),

  addTask: (newTitle, newPriority, selectedLabels) => {
    const activeUserId = get().activeUserId;
    if (!activeUserId) return;
    if (!newTitle.trim() || newTitle.length > INPUT_LENGTH.TASK_TITLE) return;

    const { activeProjectId } = get();
    if (!activeProjectId) return;

    const actualProject = get().projects.find(p => p.id === activeProjectId);
    const maxOrder = actualProject?.tasks.reduce((max, t) => Math.max(max, t.orderIndex || 0), 0) || 0;

    const newTask: FrontendTask = {
      id: crypto.randomUUID(),
      title: newTitle,
      done: false,
      priority: newPriority,
      labels: selectedLabels,
      projectId: activeProjectId,
      orderIndex: maxOrder + 1,
    };

    createTask({ ...newTask, projectIds: [activeProjectId] }, activeUserId)
      .then(data => console.log("✅ Task created via Server Action:", data))
      .catch(err => console.error("❌ Server Action Error:", err));

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === activeProjectId ? { ...p, tasks: [...p.tasks, newTask] } : p
      ),
      newTitle: "",
      // newPriority and selectedLabels remain the same so the user can quickly add multiple similar tasks
    }));
  },

  toggleTask: (id) => {
    const activeUserId = get().activeUserId;
    if (!activeUserId) return;
    const { activeProjectId, projects } = get();
    const actualProject = projects.find(p => p.id === activeProjectId);
    const actualTasksList = actualProject?.tasks || [];
    const taskToToggle = actualTasksList.find(t => t.id === id);

    if (taskToToggle) {
      updateTaskAction(id, { done: !taskToToggle.done }, activeUserId)
        .then(data => console.log("🔄 Task toggled via Server Action:", data))
        .catch(err => console.error("❌ Server Action Error:", err));
    }

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === activeProjectId
          ? { ...p, tasks: p.tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t) }
          : p
      )
    }));
  },

  deleteTask: (id) => {
    const activeUserId = get().activeUserId;
    if (!activeUserId) return;
    const { activeProjectId } = get();
    deleteTaskAction(id, activeUserId)
      .then(data => console.log("🗑️ Task deleted via Server Action:", data))
      .catch(err => console.error("❌ Server Action Error:", err));

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === activeProjectId ? { ...p, tasks: p.tasks.filter((t) => t.id !== id) } : p
      )
    }));
    if (typeof window !== 'undefined') localStorage.removeItem(`task-${id}-seconds`);
  },

  deleteAllTasks: () => {
    const activeUserId = get().activeUserId;
    if (!activeUserId) return;
    const { activeProjectId } = get();
    if (!activeProjectId) return;

    deleteAllTasksAction(activeProjectId, activeUserId)
      .then(data => console.log("🗑️ ALL Tasks deleted via Server Action for project:", data))
      .catch(err => console.error("❌ Server Action Error:", err));

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === activeProjectId ? { ...p, tasks: [] } : p
      )
    }));
  },

  deleteTaskLabel: (taskId, labelId) => {
    const activeUserId = get().activeUserId;
    if (!activeUserId) return;
    const { activeProjectId, projects } = get();
    const actualProject = projects.find(p => p.id === activeProjectId);
    const actualTasksList = actualProject?.tasks || [];
    const task = actualTasksList.find((t) => t.id === taskId);
    if (!task) return;

    const newLabels = task.labels.filter((l) => l !== labelId);

    updateTaskAction(taskId, { labels: newLabels }, activeUserId)
      .then(data => console.log("✅ Task label deleted via Server Action:", data))
      .catch(err => console.error("❌ Server Action Error:", err));

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === activeProjectId
          ? { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, labels: newLabels } : t)) }
          : p
      )
    }));
  },

  toggleLabelOnTask: (taskId, labelId) => {
    const activeUserId = get().activeUserId;
    if (!activeUserId) return;
    const { activeProjectId, projects } = get();
    const actualProject = projects.find(p => p.id === activeProjectId);
    const actualTasksList = actualProject?.tasks || [];
    const task = actualTasksList.find((t) => t.id === taskId);
    if (!task) return;

    const hasLabel = task.labels.includes(labelId);
    const newLabels = hasLabel
      ? task.labels.filter((l) => l !== labelId)
      : [...task.labels, labelId];

    updateTaskAction(taskId, { labels: newLabels }, activeUserId)
      .then(data => console.log("✅ Task label toggled via Server Action:", data))
      .catch(err => console.error("❌ Server Action Error:", err));

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === activeProjectId
          ? { ...p, tasks: p.tasks.map((t) => t.id === taskId ? { ...t, labels: newLabels } : t) }
          : p
      )
    }));
  },

  updateTask: (id, updatedTask) => {
    const activeUserId = get().activeUserId;
    if (!activeUserId) return;
    const { activeProjectId } = get();

    updateTaskAction(id, updatedTask, activeUserId)
      .then(data => console.log("✏️ Task updated via Server Action:", data))
      .catch(err => console.error("❌ Server Action Error:", err));

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === activeProjectId
          ? { ...p, tasks: p.tasks.map((t) => (t.id === id ? { ...t, ...updatedTask } : t)) }
          : p
      )
    }));
  },

  reorderTasks: (newFilteredOrder) => {
    const { activeProjectId, draggingTaskId, projects } = get();
    if (!activeProjectId || !draggingTaskId) return;

    const actualProject = projects.find(p => p.id === activeProjectId);
    if (!actualProject) return;

    // 1. Find the new index of the dragged task in the visually sorted array
    const newIndex = newFilteredOrder.findIndex(t => t.id === draggingTaskId);
    if (newIndex === -1) return;

    // 2. Calculate the Fractional orderIndex based on the new neighbors
    const prevItem = newFilteredOrder[newIndex - 1];
    const nextItem = newFilteredOrder[newIndex + 1];

    let newOrderIndex = 0;
    if (prevItem && nextItem) {
      newOrderIndex = ((prevItem.orderIndex || 0) + (nextItem.orderIndex || 0)) / 2.0;
    } else if (prevItem) {
      newOrderIndex = (prevItem.orderIndex || 0) + 1.0; // Moved to very bottom
    } else if (nextItem) {
      newOrderIndex = (nextItem.orderIndex || 0) - 1.0; // Moved to very top
    }

    // SNAPSHOT: Take a snapshot of the current state before we optimistically update
    const previousProjectsSnapshot = projects;

    // 3. Update ONLY the dragged task's orderIndex in the GLOBAL array, and sort it.
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === activeProjectId
          ? {
              ...p,
              tasks: p.tasks
                .map(t => t.id === draggingTaskId ? { ...t, orderIndex: newOrderIndex } : t)
                .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
            }
          : p
      )
    }));

    // 4. Save to backend asynchronously
    const activeUserId = get().activeUserId;
    if (activeUserId) {
      updateTaskAction(draggingTaskId, { orderIndex: newOrderIndex }, activeUserId)
        .then(() => console.log("✅ Task order updated in database"))
        .catch((err) => {
          console.error("❌ Failed to update task order in database:", err);
          
          // ROLLBACK: Revert to the snapshot if the backend fails
          set({ projects: previousProjectsSnapshot });
          alert("Network error: couldn't save task order. Changes reverted.");
        });
    }
  }
});
