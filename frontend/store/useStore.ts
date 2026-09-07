import { create } from 'zustand';
import { AppState } from './types';
import { createProjectSlice } from './slices/createProjectSlice';
import { createLabelSlice } from './slices/createLabelSlice';
import { createTaskSlice } from './slices/createTaskSlice';
import { createModalSlice } from './slices/createModalSlice';

// Re-export types
export type { FrontendLabel, FrontendTask, FrontendProject, AppState } from './types';

const useStore = create<AppState>((...a) => ({
  ...createProjectSlice(...a),
  ...createLabelSlice(...a),
  ...createTaskSlice(...a),
  ...createModalSlice(...a)
}));

export default useStore;
