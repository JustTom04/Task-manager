import { StateCreator } from 'zustand';
import { AppState, LabelSlice, FrontendLabel } from '../types';
import { INPUT_LENGTH } from '../../utils';
import { deleteLabel as deleteLabelAction, deleteAllLabels as deleteAllLabelsAction, createLabel } from "@/backend/actions/labelActions";

export const createLabelSlice: StateCreator<AppState, [], [], LabelSlice> = (set, get) => ({
  selectedLabels: [],
  labelsFilter: [],

  setSelectedLabels: (val) => set({ selectedLabels: typeof val === 'function' ? val(get().selectedLabels) : val }),
  setLabelsFilter: (filter) => set({ labelsFilter: typeof filter === 'function' ? filter(get().labelsFilter) : filter }),

  addLabelToProject: (newLabel) => {
    const activeUserId = get().activeUserId;
    if (!activeUserId) return;
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

  deleteLabel: (id) => {
    const activeUserId = get().activeUserId;
    if (!activeUserId) return;
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

  deleteAllLabels: () => {
    const activeUserId = get().activeUserId;
    if (!activeUserId) return;
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
  }
});
