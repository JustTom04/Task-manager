import { StateCreator } from 'zustand';
import { AppState, ToastSlice, ToastMessage, ToastType } from '../types';

export const createToastSlice: StateCreator<AppState, [], [], ToastSlice> = (set, get) => ({
  toasts: [],

  showToast: (message: string, type: ToastType = 'info', duration: number = 4000) => {
    const id = crypto.randomUUID();
    const newToast: ToastMessage = { id, message, type, duration };

    set((state) => ({
      // Keep up to 3 most recent toasts to prevent screen overflow
      toasts: [...state.toasts.slice(-2), newToast],
    }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
});
