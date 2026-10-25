import { StateCreator } from 'zustand';
import { AppState, TaskSlice, FrontendTask } from '../types';
import { INPUT_LENGTH, MAX_TASKS_PER_PROJECT } from '@/frontend/constants';
import { createTask, updateTask as updateTaskAction, deleteTask as deleteTaskAction, deleteAllTasks as deleteAllTasksAction, getTaskDescription as getTaskDescriptionAction } from "@/backend/actions/taskActions";

export const createTaskSlice: StateCreator<AppState, [], [], TaskSlice> = (set, get) => ({
  newTitle: "",
  newDescription: "",
  newPriority: "mid",
  statusFilter: "ALL",
  priorityFilter: "ALL",
  isLoadingTasks: false,
  draggingTaskId: null,

  setNewTitle: (val) => set({ newTitle: typeof val === 'function' ? val(get().newTitle) : val }),
  setNewDescription: (val) => set({ newDescription: typeof val === 'function' ? val(get().newDescription) : val }),
  setNewPriority: (val) => set({ newPriority: typeof val === 'function' ? val(get().newPriority) : val }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  setPriorityFilter: (filter) => set({ priorityFilter: filter }),
  setIsLoadingTasks: (loading) => set({ isLoadingTasks: loading }),
  setDraggingTaskId: (id) => set({ draggingTaskId: id }),

  addTask: (newTitle, newPriority, selectedLabels, description) => {
    const activeUserId = get().activeUserId;
    if (!activeUserId) return;
    if (!newTitle.trim() || newTitle.length > INPUT_LENGTH.TASK_TITLE) return;
    const trimmedDescription = description?.trim() || null;
    if (trimmedDescription && trimmedDescription.length > INPUT_LENGTH.TASK_DESCRIPTION) return;

    const { activeProjectId } = get();
    if (!activeProjectId) return;

    const actualProject = get().projects.find(p => p.id === activeProjectId);
    if ((actualProject?.tasks.length || 0) >= MAX_TASKS_PER_PROJECT) return;

    const maxOrder = actualProject?.tasks.reduce((max, t) => Math.max(max, t.orderIndex || 0), 0) || 0;

    const hasDescription = Boolean(trimmedDescription && trimmedDescription.length > 0);

    const newTask: FrontendTask = {
      id: crypto.randomUUID(),
      title: newTitle,
      description: trimmedDescription,
      hasDescription,
      done: false,
      priority: newPriority,
      labels: selectedLabels,
      projectId: activeProjectId,
      orderIndex: maxOrder + 1,
    };

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === activeProjectId ? { ...p, tasks: [...p.tasks, newTask] } : p
      ),
      newTitle: "",
      newDescription: "",
      // newPriority and selectedLabels remain the same so the user can quickly add multiple similar tasks
    }));

    createTask({ ...newTask, projectIds: [activeProjectId] }, activeUserId)
      .catch((err) => {
        console.error("❌ Server Action Error (createTask):", err);
        // ATOMIC ROLLBACK: Remove only this failed task by its unique ID
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === activeProjectId
              ? { ...p, tasks: p.tasks.filter((t) => t.id !== newTask.id) }
              : p
          )
        }));
        get().showToast("Network error: Failed to create task. Changes reverted.", "error");
      });
  },

  toggleTask: (id) => {
    const activeUserId = get().activeUserId;
    if (!activeUserId) return;
    const { activeProjectId, projects } = get();
    const actualProject = projects.find(p => p.id === activeProjectId);
    const actualTasksList = actualProject?.tasks || [];
    const taskToToggle = actualTasksList.find(t => t.id === id);
    if (!taskToToggle) return;

    const previousDone = taskToToggle.done;

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === activeProjectId
          ? { ...p, tasks: p.tasks.map((t) => t.id === id ? { ...t, done: !previousDone } : t) }
          : p
      )
    }));

    updateTaskAction(id, { done: !previousDone }, activeUserId)
      .catch((err) => {
        console.error("❌ Server Action Error (toggleTask):", err);
        // ATOMIC ROLLBACK: Revert only this task's done status
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === activeProjectId
              ? { ...p, tasks: p.tasks.map((t) => (t.id === id ? { ...t, done: previousDone } : t)) }
              : p
          )
        }));
        get().showToast("Network error: Failed to update task status. Changes reverted.", "error");
      });
  },

  deleteTask: (id) => {
    const activeUserId = get().activeUserId;
    if (!activeUserId) return;
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;

    const actualProject = projects.find(p => p.id === activeProjectId);
    const originalIndex = actualProject?.tasks.findIndex(t => t.id === id) ?? -1;
    const taskToDelete = actualProject?.tasks[originalIndex];
    if (!taskToDelete || originalIndex === -1) return;

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === activeProjectId ? { ...p, tasks: p.tasks.filter((t) => t.id !== id) } : p
      )
    }));

    deleteTaskAction(id, activeUserId)
      .then(() => {
        if (typeof window !== 'undefined') localStorage.removeItem(`task-${id}-seconds`);
      })
      .catch((err) => {
        console.error("❌ Server Action Error (deleteTask):", err);
        // ATOMIC ROLLBACK: Re-insert only this deleted task into its exact original position
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== activeProjectId) return p;
            const restoredTasks = [...p.tasks];
            restoredTasks.splice(originalIndex, 0, taskToDelete);
            return { ...p, tasks: restoredTasks };
          })
        }));
        get().showToast("Network error: Failed to delete task. Changes reverted.", "error");
      });
  },

  deleteAllTasks: () => {
    const activeUserId = get().activeUserId;
    if (!activeUserId) return;
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;

    const actualProject = projects.find(p => p.id === activeProjectId);
    const previousTasks = actualProject?.tasks || [];

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === activeProjectId ? { ...p, tasks: [] } : p
      )
    }));

    deleteAllTasksAction(activeProjectId, activeUserId)
      .catch((err) => {
        console.error("❌ Server Action Error (deleteAllTasks):", err);
        // ATOMIC ROLLBACK: Restore only this project's tasks
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === activeProjectId ? { ...p, tasks: previousTasks } : p
          )
        }));
        get().showToast("Network error: Failed to delete all tasks. Changes reverted.", "error");
      });
  },

  toggleLabelOnTask: (taskId, labelId) => {
    const activeUserId = get().activeUserId;
    if (!activeUserId) return;
    const { activeProjectId, projects } = get();
    const actualProject = projects.find(p => p.id === activeProjectId);
    const actualTasksList = actualProject?.tasks || [];
    const task = actualTasksList.find((t) => t.id === taskId);
    if (!task) return;

    const previousLabels = task.labels;
    const hasLabel = previousLabels.includes(labelId);
    const newLabels = hasLabel
      ? previousLabels.filter((l) => l !== labelId)
      : [...previousLabels, labelId];

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === activeProjectId
          ? { ...p, tasks: p.tasks.map((t) => t.id === taskId ? { ...t, labels: newLabels } : t) }
          : p
      )
    }));

    updateTaskAction(taskId, { labels: newLabels }, activeUserId)
      .catch((err) => {
        console.error("❌ Server Action Error (toggleLabelOnTask):", err);
        // ATOMIC ROLLBACK: Revert only this task's labels
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === activeProjectId
              ? { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, labels: previousLabels } : t)) }
              : p
          )
        }));
        get().showToast("Network error: Failed to update task label. Changes reverted.", "error");
      });
  },

  updateTask: (id, updatedTask) => {
    const activeUserId = get().activeUserId;
    if (!activeUserId) return;
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;

    const actualProject = projects.find(p => p.id === activeProjectId);
    const taskToUpdate = actualProject?.tasks.find(t => t.id === id);
    if (!taskToUpdate) return;

    // If description is updated, keep hasDescription synchronized
    const patch: Partial<FrontendTask> = { ...updatedTask };
    if (updatedTask.description !== undefined) {
      patch.hasDescription = Boolean(updatedTask.description && updatedTask.description.trim().length > 0);
    }

    // Snapshot only the fields that are being updated
    const previousFields: Partial<FrontendTask> = {};
    for (const key of Object.keys(patch) as (keyof FrontendTask)[]) {
      (previousFields as any)[key] = taskToUpdate[key];
    }

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === activeProjectId
          ? { ...p, tasks: p.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }
          : p
      )
    }));

    updateTaskAction(id, updatedTask, activeUserId)
      .catch((err) => {
        console.error("❌ Server Action Error (updateTask):", err);
        // ATOMIC ROLLBACK: Restore only this task's previous fields
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === activeProjectId
              ? { ...p, tasks: p.tasks.map((t) => (t.id === id ? { ...t, ...previousFields } : t)) }
              : p
          )
        }));
        get().showToast("Network error: Failed to save task changes. Changes reverted.", "error");
      });
  },

  loadTaskDescription: async (taskId) => {
    const activeUserId = get().activeUserId;
    if (!activeUserId) return null;
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return null;

    const actualProject = projects.find(p => p.id === activeProjectId);
    const task = actualProject?.tasks.find(t => t.id === taskId);
    if (!task) return null;

    // In-memory cache: if description was already loaded, return immediately without network call
    if (task.description !== undefined) {
      return task.description;
    }

    try {
      const description = await getTaskDescriptionAction(taskId, activeUserId);
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === activeProjectId
            ? {
                ...p,
                tasks: p.tasks.map((t) =>
                  t.id === taskId
                    ? {
                        ...t,
                        description,
                        hasDescription: Boolean(description && description.trim().length > 0),
                      }
                    : t
                ),
              }
            : p
        ),
      }));
      return description;
    } catch (err) {
      console.error("❌ Server Action Error (getTaskDescription):", err);
      get().showToast("Network error: Failed to load description.", "error");
      return null;
    }
  },

  reorderTasks: (newFilteredOrder) => {
    const { activeProjectId, draggingTaskId, projects } = get();
    if (!activeProjectId || !draggingTaskId) return;

    const actualProject = projects.find(p => p.id === activeProjectId);
    if (!actualProject) return;

    const draggedTask = actualProject.tasks.find(t => t.id === draggingTaskId);
    if (!draggedTask) return;

    const previousOrderIndex = draggedTask.orderIndex || 0;

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
        .catch((err) => {
          console.error("❌ Failed to update task order in database:", err);
          
          // ATOMIC ROLLBACK: Revert only this task's orderIndex and re-sort
          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === activeProjectId
                ? {
                    ...p,
                    tasks: p.tasks
                      .map((t) => (t.id === draggingTaskId ? { ...t, orderIndex: previousOrderIndex } : t))
                      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                  }
                : p
            )
          }));
          get().showToast("Network error: Couldn't save task order. Changes reverted.", "error");
        });
    }
  }
});
