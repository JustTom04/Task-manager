import { StateCreator } from 'zustand';
import { AppState, ProjectSlice, FrontendProject } from '../types';
import { INPUT_LENGTH } from '../../utils';
import { getProjects, createProject, deleteProject as deleteProjectAction, updateProject as updateProjectAction } from "@/backend/actions/projectActions";

export const createProjectSlice: StateCreator<AppState, [], [], ProjectSlice> = (set, get) => ({
  projects: [],
  activeProjectId: typeof window !== 'undefined' ? localStorage.getItem("activeProjectId") || null : null,
  activeUserId: null,

  setActiveProjectId: (id) => {
    if (typeof window !== 'undefined' && id) {
      localStorage.setItem("activeProjectId", id);
    }
    set({ activeProjectId: id });
  },

  setActiveUserId: (id) => set({ activeUserId: id }),

  fetchProjects: async () => {
    const activeUserId = get().activeUserId;
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

  addProject: (name) => {
    const activeUserId = get().activeUserId;
    if (!activeUserId) return;
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

  deleteProject: (projectId) => {
    const activeUserId = get().activeUserId;
    if (!activeUserId) return;
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

  renameProject: (projectId, newName) => {
    const activeUserId = get().activeUserId;
    if (!activeUserId) return;
    const trimmedName = newName?.trim();
    if (!trimmedName || trimmedName.length > INPUT_LENGTH.PROJECT_NAME) return;

    set((state) => ({
      projects: state.projects.map(p => p.id === projectId ? { ...p, name: trimmedName } : p)
    }));

    updateProjectAction({ id: projectId, name: trimmedName, userId: activeUserId })
      .then(data => console.log("✅ Project renamed via Server Action:", data))
      .catch(err => console.error("❌ Server Action Error:", err));
  }
});
