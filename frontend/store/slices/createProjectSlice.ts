import { StateCreator } from 'zustand';
import { AppState, ProjectSlice, FrontendProject, FrontendTask } from '../types';
import { INPUT_LENGTH, MAX_PROJECTS_PER_USER } from '@/frontend/constants';
import { getProjects, createProject, deleteProject as deleteProjectAction, updateProject as updateProjectAction } from "@/backend/actions/projectActions";
import { getProjectTasks } from "@/backend/actions/taskActions";

export const createProjectSlice: StateCreator<AppState, [], [], ProjectSlice> = (set, get) => ({
  projects: [],
  activeProjectId: typeof window !== 'undefined' ? localStorage.getItem("activeProjectId") || null : null,
  activeUserId: null,

  setActiveProjectId: (id) => {
    if (typeof window !== 'undefined' && id) {
      localStorage.setItem("activeProjectId", id);
    }
    set({ activeProjectId: id });
    if (id) {
      get().fetchProjectTasks(id);
    }
  },

  setActiveUserId: (id) => set({ activeUserId: id }),

  fetchProjectTasks: async (projectId: string) => {
    const activeUserId = get().activeUserId;
    if (!activeUserId || !projectId) return;

    const project = get().projects.find(p => p.id === projectId);
    // In-memory cache: if tasks for this project were already loaded, skip network request!
    if (project?.tasksLoaded) {
      return;
    }

    get().setIsLoadingTasks(true);

    try {
      const tasks = await getProjectTasks(projectId, activeUserId);
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId
            ? { ...p, tasks: tasks as unknown as FrontendTask[], tasksLoaded: true }
            : p
        )
      }));
    } catch (err) {
      console.error("❌ Failed to lazy-load tasks:", err);
    } finally {
      get().setIsLoadingTasks(false);
    }
  },

  fetchProjects: async () => {
    const activeUserId = get().activeUserId;
    if (!activeUserId) return;
    try {
      const projectsTree = await getProjects(activeUserId);
      if (projectsTree && projectsTree.length > 0) {
        // Enforce deterministic ordering: "General" project must always remain at index 0
        const generalIndex = projectsTree.findIndex((p: any) => p.name === "General");
        if (generalIndex > 0) {
          const generalProject = projectsTree.splice(generalIndex, 1)[0];
          projectsTree.unshift(generalProject);
        }

        set({ projects: projectsTree as unknown as FrontendProject[] });

        const state = get();
        const stillExists = projectsTree.find((p: FrontendProject) => p.id === state.activeProjectId);
        const targetId = stillExists ? state.activeProjectId : projectsTree[0].id;

        state.setActiveProjectId(targetId);
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
    if (get().projects.length >= MAX_PROJECTS_PER_USER) return;

    const { projects, activeProjectId: previousActiveProjectId } = get();
    const generalLabels = projects[0]?.labels || [];

    const newProject: FrontendProject = {
      id: crypto.randomUUID(),
      name: trimmedName,
      userId: activeUserId,
      tasks: [],
      labels: generalLabels.map((l) => ({ ...l, id: crypto.randomUUID() })),
      tasksLoaded: true, // Brand-new project starts with empty tasks already "loaded"
    };

    set((state) => ({
      projects: [...state.projects, newProject]
    }));
    get().setActiveProjectId(newProject.id);

    createProject({ ...newProject, userId: activeUserId })
      .catch((err) => {
        console.error("❌ Server Action Error (createProject):", err);
        // ATOMIC ROLLBACK: Remove the failed project and restore the previous active project
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== newProject.id)
        }));
        if (get().activeProjectId === newProject.id && previousActiveProjectId) {
          get().setActiveProjectId(previousActiveProjectId);
        }
        get().showToast("Network error: Failed to create project. Changes reverted.", "error");
      });
  },

  deleteProject: (projectId) => {
    const activeUserId = get().activeUserId;
    if (!activeUserId) return;

    const { projects, activeProjectId: previousActiveProjectId } = get();
    const projectIndex = projects.findIndex(p => p.id === projectId);
    const projectToDelete = projects[projectIndex];
    if (!projectToDelete || projectIndex <= 0) return; // General project at index 0 cannot be deleted

    set((state) => {
      const prevProjects = state.projects;
      const newProjects = prevProjects.filter((p) => p.id !== projectId);

      const stillExists = newProjects.find(p => p.id === state.activeProjectId);
      if (!stillExists && newProjects.length > 0) {
        if (typeof window !== 'undefined') localStorage.setItem("activeProjectId", newProjects[0].id);
        get().fetchProjectTasks(newProjects[0].id);
        return { projects: newProjects, activeProjectId: newProjects[0].id };
      }
      return { projects: newProjects };
    });

    deleteProjectAction(projectId, activeUserId)
      .catch((err) => {
        console.error("❌ Server Action Error (deleteProject):", err);
        // ATOMIC ROLLBACK: Re-insert project at original index and restore activeProjectId if needed
        set((state) => {
          const restored = [...state.projects];
          restored.splice(projectIndex, 0, projectToDelete);
          return { projects: restored };
        });
        if (previousActiveProjectId) {
          get().setActiveProjectId(previousActiveProjectId);
        }
        get().showToast("Network error: Failed to delete project. Changes reverted.", "error");
      });
  },

  renameProject: (projectId, newName) => {
    const activeUserId = get().activeUserId;
    if (!activeUserId) return;
    const trimmedName = newName?.trim();
    if (!trimmedName || trimmedName.length > INPUT_LENGTH.PROJECT_NAME) return;

    const targetProject = get().projects.find(p => p.id === projectId);
    const previousName = targetProject?.name;
    if (!targetProject || !previousName) return;

    set((state) => ({
      projects: state.projects.map(p => p.id === projectId ? { ...p, name: trimmedName } : p)
    }));

    updateProjectAction({ id: projectId, name: trimmedName, userId: activeUserId })
      .catch((err) => {
        console.error("❌ Server Action Error (updateProject):", err);
        // ATOMIC ROLLBACK: Revert project name back to previousName
        set((state) => ({
          projects: state.projects.map(p => p.id === projectId ? { ...p, name: previousName } : p)
        }));
        get().showToast("Network error: Failed to rename project. Changes reverted.", "error");
      });
  }
});
