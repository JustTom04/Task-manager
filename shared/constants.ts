/**
 * Shared constants and validation limits used by both frontend and backend.
 */

export const MAX_TASKS_PER_PROJECT = 200;
export const MAX_PROJECTS_PER_USER = 50;
export const MAX_LABELS_PER_PROJECT = 50;

export const INPUT_LENGTH = {
  TASK_TITLE: 60,
  PROJECT_NAME: 60,
  LABEL_NAME: 40,
} as const;

export const AUTH_LIMITS = {
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 100,
} as const;
