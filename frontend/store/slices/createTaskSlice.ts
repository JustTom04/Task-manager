import { StateCreator } from 'zustand';
import { AppState, TaskSlice, FrontendTask } from '../types';
import { INPUT_LENGTH } from '../../utils';
import { createTask, updateTask as updateTaskAction, deleteTask as deleteTaskAction, deleteAllTasks as deleteAllTasksAction } from "@/backend/actions/taskActions";

export const createTaskSlice: StateCreator<AppState, [], [], TaskSlice> = (set, get) => ({
  newTitle: "",
  newPriority: "mid",
  statusFilter: "ALL",
  priorityFilter: "ALL",
  isLoadingTasks: false,

  setNewTitle: (val) => set({ newTitle: typeof val === 'function' ? val(get().newTitle) : val }),
  setNewPriority: (val) => set({ newPriority: typeof val === 'function' ? val(get().newPriority) : val }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  setPriorityFilter: (filter) => set({ priorityFilter: filter }),
  setIsLoadingTasks: (loading) => set({ isLoadingTasks: loading }),

  addTask: (newTitle, newPriority, selectedLabels) => {
    const activeUserId = get().activeUserId;
    if (!activeUserId) return;
    if (!newTitle.trim() || newTitle.length > INPUT_LENGTH.TASK_TITLE) return;

    const { activeProjectId } = get();
    if (!activeProjectId) return;

    const newTask: FrontendTask = {
      id: crypto.randomUUID(),
      title: newTitle,
      done: false,
      priority: newPriority,
      labels: selectedLabels,
      projectId: activeProjectId,
    };

    createTask({ ...newTask, projectIds: [activeProjectId] }, activeUserId)
      .then(data => console.log("✅ Task created via Server Action:", data))
      .catch(err => console.error("❌ Server Action Error:", err));

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === activeProjectId ? { ...p, tasks: [...p.tasks, newTask] } : p
      ),
      newTitle: "",
      newPriority: "mid",
      selectedLabels: []
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
  }
});
