import { StateCreator } from 'zustand';
import { AppState, LabelSlice, FrontendLabel } from '../types';
import { INPUT_LENGTH, MAX_LABELS_PER_PROJECT } from '@/frontend/constants';
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
    if (!activeProjectId) return;

    const actualProject = get().projects.find(p => p.id === activeProjectId);
    if ((actualProject?.labels?.length || 0) >= MAX_LABELS_PER_PROJECT) return;

    newLabel.projectIds = [activeProjectId];

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === activeProjectId
          ? { ...p, labels: [...(p.labels || []), newLabel as FrontendLabel] }
          : p
      )
    }));

    createLabel(newLabel, activeUserId)
      .catch((err) => {
        console.error("❌ Server Action Error (createLabel):", err);
        // ATOMIC ROLLBACK: Remove only this failed label by ID
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === activeProjectId
              ? { ...p, labels: (p.labels || []).filter((l) => l.id !== newLabel.id) }
              : p
          )
        }));
        get().showToast("Network error: Failed to create label. Changes reverted.", "error");
      });
  },

  deleteLabel: (id) => {
    const activeUserId = get().activeUserId;
    if (!activeUserId) return;
    const { activeProjectId } = get();
    if (!activeProjectId) return;

    const actualProject = get().projects.find(p => p.id === activeProjectId);
    const labelToDelete = actualProject?.labels?.find(l => l.id === id);
    const originalLabelIndex = actualProject?.labels?.findIndex(l => l.id === id) ?? -1;
    if (!labelToDelete || originalLabelIndex === -1) return;

    const tasksWithLabel = actualProject?.tasks.filter(t => t.labels.includes(id)).map(t => t.id) || [];
    const wasInFilter = get().labelsFilter.includes(id);

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

    deleteLabelAction(id, activeUserId)
      .catch((err) => {
        console.error("❌ Server Action Error (deleteLabel):", err);
        // ATOMIC ROLLBACK: Re-insert label at its original index and re-attach to affected tasks
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== activeProjectId) return p;
            const restoredLabels = [...(p.labels || [])];
            restoredLabels.splice(originalLabelIndex, 0, labelToDelete);
            return {
              ...p,
              labels: restoredLabels,
              tasks: p.tasks.map((task) =>
                tasksWithLabel.includes(task.id) && !task.labels.includes(id)
                  ? { ...task, labels: [...task.labels, id] }
                  : task
              ),
            };
          }),
          labelsFilter: wasInFilter && !state.labelsFilter.includes(id)
            ? [...state.labelsFilter, id]
            : state.labelsFilter
        }));
        get().showToast("Network error: Failed to delete label. Changes reverted.", "error");
      });
  },

  deleteAllLabels: () => {
    const activeUserId = get().activeUserId;
    if (!activeUserId) return;
    const { activeProjectId } = get();
    if (!activeProjectId) return;

    const actualProject = get().projects.find(p => p.id === activeProjectId);
    const previousLabels = actualProject?.labels || [];
    const previousTaskLabels = actualProject?.tasks.map(t => ({ id: t.id, labels: t.labels })) || [];
    const previousLabelsFilter = get().labelsFilter;

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === activeProjectId
          ? { ...p, labels: [], tasks: p.tasks.map(t => ({ ...t, labels: [] })) }
          : p
      ),
      labelsFilter: []
    }));

    deleteAllLabelsAction(activeProjectId, activeUserId)
      .catch((err) => {
        console.error("❌ Server Action Error (deleteAllLabels):", err);
        // ATOMIC ROLLBACK: Restore only this project's labels and task attachments
        const labelMap = new Map(previousTaskLabels.map(item => [item.id, item.labels]));
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === activeProjectId
              ? {
                  ...p,
                  labels: previousLabels,
                  tasks: p.tasks.map(t => ({ ...t, labels: labelMap.get(t.id) || t.labels }))
                }
              : p
          ),
          labelsFilter: previousLabelsFilter
        }));
        get().showToast("Network error: Failed to delete all labels. Changes reverted.", "error");
      });
  }
});
