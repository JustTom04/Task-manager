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

export interface ProjectSlice {
  projects: FrontendProject[];
  activeProjectId: string | null;
  activeUserId: string | null;
  setActiveProjectId: (id: string | null) => void;
  setActiveUserId: (id: string | null) => void;
  fetchProjects: () => Promise<void>;
  addProject: (name: string) => void;
  deleteProject: (projectId: string) => void;
  renameProject: (projectId: string, newName: string) => void;
}

export interface LabelSlice {
  selectedLabels: string[];
  labelsFilter: string[];
  setSelectedLabels: (val: string[] | ((prev: string[]) => string[])) => void;
  setLabelsFilter: (filter: string[] | ((prev: string[]) => string[])) => void;
  addLabelToProject: (newLabel: { name: string; color: string; id?: string; projectIds?: string[] }) => void;
  deleteLabel: (id: string) => void;
  deleteAllLabels: () => void;
}

export interface ModalSlice {
  confirmConfig: { action: () => void; title: string; message: string } | null;
  showLabelModal: boolean;
  setConfirmConfig: (config: { action: () => void; title: string; message: string } | null) => void;
  setShowLabelModal: (show: boolean) => void;
}

export interface TaskSlice {
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
  addTask: (newTitle: string, newPriority: string, selectedLabels: string[]) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  deleteAllTasks: () => void;
  deleteTaskLabel: (taskId: string, labelId: string) => void;
  toggleLabelOnTask: (taskId: string, labelId: string) => void;
  updateTask: (id: string, updatedTask: Partial<FrontendTask>) => void;
}

export interface AppState extends ProjectSlice, LabelSlice, TaskSlice, ModalSlice {}
