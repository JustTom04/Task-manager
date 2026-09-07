export const INPUT_LENGTH = {
  TASK_TITLE: 60,
  PROJECT_NAME: 60,
  LABEL_NAME: 40,
};

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
    { value: "On working", label: "On working" },
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
