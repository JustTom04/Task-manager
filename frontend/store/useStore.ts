import { create } from 'zustand';
import { INPUT_LENGTH } from '../utils';

// --- NEXT.JS SERVER ACTIONS IMPORT ---
import { getProjects, createProject, deleteProject as deleteProjectAction, updateProject as updateProjectAction } from "@/backend/actions/projectActions";
import { deleteLabel as deleteLabelAction, deleteAllLabels as deleteAllLabelsAction, createLabel } from "@/backend/actions/labelActions";
import { createTask, updateTask as updateTaskAction, deleteTask as deleteTaskAction, deleteAllTasks as deleteAllTasksAction } from "@/backend/actions/taskActions";

export interface FrontendLabel {
  id: string;
  name: string;
  color: string;
  projectId?: string | null;
}

export interface FrontendTask {
  id: string;
  title: string;
  done: boolean;
  priority: string;
  labels: string[]; // Frontend only expects an array of label IDs
  projectId: string;
}

export interface FrontendProject {
  id: string;
  name: string;
  userId?: string | null;
  labels: FrontendLabel[];
  tasks: FrontendTask[];
}

export interface AppState {
  // Project Slice
  projects: FrontendProject[];
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  fetchProjects: (activeUserId: string) => Promise<void>;
  addProject: (name: string, activeUserId: string) => void;
  deleteProject: (projectId: string, activeUserId: string) => void;
  renameProject: (projectId: string, newName: string, activeUserId: string) => void;

  // Label Slice
  selectedLabels: string[];
  labelsFilter: string[];
  setSelectedLabels: (val: string[] | ((prev: string[]) => string[])) => void;
  setLabelsFilter: (filter: string[] | ((prev: string[]) => string[])) => void;
  addLabelToProject: (newLabel: { name: string; color: string; id?: string; projectIds?: string[] }, activeUserId: string) => void;
  deleteLabel: (id: string, activeUserId: string) => void;
  deleteAllLabels: (activeUserId: string) => void;

  // Task Slice
  newTitle: string;
  newPriority: string;
  statusFilter: string;
  priorityFilter: string;
  isLoadingTasks: boolean;
  setNewTitle: (val: string | ((prev: string) => string)) => void;
  setNewPriority: (val: string | ((prev: string) => string)) => void;
  setStatusFilter: (filter: string) => void;
  setPriorityFilter: (filter: string) => void;
  setIsLoadingTasks: (loading: boolean) => void;
  addTask: (newTitle: string, newPriority: string, selectedLabels: string[], activeUserId: string) => void;
  toggleTask: (id: string, activeUserId: string) => void;
  deleteTask: (id: string, activeUserId: string) => void;
  deleteAllTasks: (activeUserId: string) => void;
  deleteTaskLabel: (taskId: string, labelId: string, activeUserId: string) => void;
  toggleLabelOnTask: (taskId: string, labelId: string, activeUserId: string) => void;
  updateTask: (id: string, updatedTask: Partial<FrontendTask>, activeUserId: string) => void;
}

const useStore = create<AppState>((set, get) => ({

  // ==========================================
  // PROJECT SLICE
  // ==========================================
  projects: [],
  activeProjectId: typeof window !== 'undefined' ? localStorage.getItem("activeProjectId") || null : null,

  setActiveProjectId: (id) => {
    if (typeof window !== 'undefined' && id) {
      localStorage.setItem("activeProjectId", id);
    }
    set({ activeProjectId: id });
  },

  fetchProjects: async (activeUserId) => {
    if (!activeUserId) return;
    try {
      const projectsTree = await getProjects(activeUserId);
      console.log("📥 Full Projects Tree loaded from Server Action:", projectsTree);
      if (projectsTree && projectsTree.length > 0) {
        set({ projects: projectsTree as unknown as FrontendProject[] });

        const state = get();
        const stillExists = projectsTree.find((p: FrontendProject) => p.id === state.activeProjectId);
        if (!stillExists) {
          state.setActiveProjectId(projectsTree[0].id);
        }
      }
    } catch (err) {
      console.error("❌ Server Action Error (getProjects):", err);
    }
  },

  addProject: (name, activeUserId) => {
    const trimmedName = name?.trim();
    if (!trimmedName || trimmedName.length > INPUT_LENGTH.PROJECT_NAME) return;

    const { projects } = get();
    const generalLabels = projects[0]?.labels || [];

    const newProject: FrontendProject = {
      id: crypto.randomUUID(),
      name: trimmedName,
      tasks: [],
      labels: generalLabels.map((l) => ({ ...l, id: crypto.randomUUID() })),
    };

    createProject({ ...newProject, userId: activeUserId })
      .then(data => console.log("✅ Project created via Server Action:", data))
      .catch(err => console.error("❌ Server Action Error:", err));

    set((state) => ({
      projects: [...state.projects, newProject]
    }));
    get().setActiveProjectId(newProject.id);
  },

  deleteProject: (projectId, activeUserId) => {
    deleteProjectAction(projectId, activeUserId)
      .then(data => console.log("🗑️ Project deleted via Server Action:", data))
      .catch(err => console.error("❌ Server Action Error:", err));

    set((state) => {
      const prevProjects = state.projects;
      if (prevProjects[0]?.id === projectId) return { projects: prevProjects };

      const newProjects = prevProjects.filter((p) => p.id !== projectId);

      const stillExists = newProjects.find(p => p.id === state.activeProjectId);
      if (!stillExists && newProjects.length > 0) {
        if (typeof window !== 'undefined') localStorage.setItem("activeProjectId", newProjects[0].id);
        return { projects: newProjects, activeProjectId: newProjects[0].id };
      }
      return { projects: newProjects };
    });
  },

  renameProject: (projectId, newName, activeUserId) => {
    const trimmedName = newName?.trim();
    if (!trimmedName || trimmedName.length > INPUT_LENGTH.PROJECT_NAME) return;

    set((state) => ({
      projects: state.projects.map(p => p.id === projectId ? { ...p, name: trimmedName } : p)
    }));

    updateProjectAction({ id: projectId, name: trimmedName, userId: activeUserId })
      .then(data => console.log("✅ Project renamed via Server Action:", data))
      .catch(err => console.error("❌ Server Action Error:", err));
  },


  // ==========================================
  // LABEL SLICE
  // ==========================================
  selectedLabels: [],
  labelsFilter: [],

  setSelectedLabels: (val) => set({ selectedLabels: typeof val === 'function' ? val(get().selectedLabels) : val }),
  setLabelsFilter: (filter) => set({ labelsFilter: typeof filter === 'function' ? filter(get().labelsFilter) : filter }),

  addLabelToProject: (newLabel, activeUserId) => {
    const trimmedName = newLabel.name?.trim();
    if (!trimmedName || trimmedName.length > INPUT_LENGTH.LABEL_NAME) return;

    const { activeProjectId } = get();
    newLabel.projectIds = activeProjectId ? [activeProjectId] : [];

    createLabel(newLabel, activeUserId)
      .then(data => console.log("✅ Label created via Server Action:", data))
      .catch(err => console.error("❌ Server Action Error:", err));

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === activeProjectId
          ? { ...p, labels: [...(p.labels || []), newLabel as FrontendLabel] }
          : p
      )
    }));
  },

  deleteLabel: (id, activeUserId) => {
    const { activeProjectId } = get();
    deleteLabelAction(id, activeUserId)
      .then(data => console.log("🗑️ Label deleted via Server Action:", data))
      .catch(err => console.error("❌ Server Action Error:", err));

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === activeProjectId
          ? {
            ...p,
            labels: p.labels.filter((label) => label.id !== id),
            tasks: p.tasks.map((task) => ({
              ...task,
              labels: task.labels.filter((lid) => lid !== id),
            })),
          }
          : p
      ),
      labelsFilter: state.labelsFilter.filter((lid) => lid !== id)
    }));
  },

  deleteAllLabels: (activeUserId) => {
    const { activeProjectId } = get();
    if (!activeProjectId) return;

    deleteAllLabelsAction(activeProjectId, activeUserId)
      .then(data => console.log("🗑️ ALL Labels deleted via Server Action for project:", data))
      .catch(err => console.error("❌ Server Action Error:", err));

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === activeProjectId
          ? { ...p, labels: [], tasks: p.tasks.map(t => ({ ...t, labels: [] })) }
          : p
      ),
      labelsFilter: []
    }));
  },


  // ==========================================
  // TASK SLICE
  // ==========================================
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

  addTask: (newTitle, newPriority, selectedLabels, activeUserId) => {
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
      )
    }));
  },

  toggleTask: (id, activeUserId) => {
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

  deleteTask: (id, activeUserId) => {
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

  deleteAllTasks: (activeUserId) => {
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

  deleteTaskLabel: (taskId, labelId, activeUserId) => {
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

  toggleLabelOnTask: (taskId, labelId, activeUserId) => {
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

  updateTask: (id, updatedTask, activeUserId) => {
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

}));

export default useStore;
