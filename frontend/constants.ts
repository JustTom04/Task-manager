export { MAX_TASKS_PER_PROJECT, MAX_PROJECTS_PER_USER, MAX_LABELS_PER_PROJECT, INPUT_LENGTH, AUTH_LIMITS } from "@/shared/constants";

export const DROPDOWN_OPTIONS = {
  PRIORITY: [
    { value: "high", label: "High" },
    { value: "mid", label: "Mid" },
    { value: "low", label: "Low" },
  ],
  PRIORITY_FILTER: [
    { value: "ALL", label: "Any priority" },
    { value: "high", label: "High" },
    { value: "mid", label: "Mid" },
    { value: "low", label: "Low" },
  ],
  STATUS_FILTER: [
    { value: "ALL", label: "All status" },
    { value: "Finished", label: "Finished" },
    { value: "In progress", label: "In progress" },
  ],
};

export const MODAL_ANIMATION = {
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  content: {
    initial: { scale: 0.95, opacity: 0, y: 6 },
    animate: { scale: 1, opacity: 1, y: 0 },
    exit: { scale: 0.95, opacity: 0, y: 6 },
    transition: { duration: 0.18, ease: "easeOut" as const }
  }
};
