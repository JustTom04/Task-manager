import { StateCreator } from 'zustand';
import { AppState, ModalSlice } from '../types';

export const createModalSlice: StateCreator<AppState, [], [], ModalSlice> = (set) => ({
  confirmConfig: null,
  showLabelModal: false,
  setConfirmConfig: (config) => set({ confirmConfig: config }),
  setShowLabelModal: (show) => set({ showLabelModal: show }),
});
