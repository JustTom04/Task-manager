import useStore from "@/frontend/store/useStore";
import * as labelActions from "@/backend/actions/labelActions";
import { MAX_LABELS_PER_PROJECT } from "@/frontend/constants";
import { FrontendLabel } from "@/frontend/store/types";

// Mock backend actions to isolate frontend store state
jest.mock("@/backend/actions/labelActions", () => ({
  createLabel: jest.fn(),
  deleteLabel: jest.fn(),
  deleteAllLabels: jest.fn(),
  updateLabel: jest.fn(),
}));

jest.mock("@/backend/actions/taskActions", () => ({
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  deleteAllTasks: jest.fn(),
  getProjectTasks: jest.fn(),
}));

jest.mock("@/backend/actions/projectActions", () => ({
  getProjects: jest.fn(),
  createProject: jest.fn(),
  deleteProject: jest.fn(),
  updateProject: jest.fn(),
}));

describe("createLabelSlice", () => {
  const mockUserId = "user-test-123";
  const mockProjectId = "project-test-1";

  beforeEach(() => {
    useStore.setState({
      activeUserId: mockUserId,
      activeProjectId: mockProjectId,
      labelsFilter: [],
      selectedLabels: [],
      projects: [
        {
          id: mockProjectId,
          name: "Test Project",
          tasks: [],
          labels: [],
          tasksLoaded: true,
        },
      ],
      toasts: [],
    });

    jest.clearAllMocks();
  });

  it("optimistically adds label to project and rolls back on failure", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    (labelActions.createLabel as jest.Mock).mockRejectedValueOnce(new Error("Server error"));

    const newLabel = {
      id: "label-1",
      name: "Urgent",
      color: "#ff0000",
      projectIds: [mockProjectId],
    };

    // Act: Add label
    useStore.getState().addLabelToProject(newLabel);

    // 1. Optimistic assertion: Label added immediately to active project
    let project = useStore.getState().projects.find((p) => p.id === mockProjectId);
    expect(project?.labels).toHaveLength(1);
    expect(project?.labels[0].name).toBe("Urgent");

    // 2. Wait for async error rollback
    await new Promise(process.nextTick);

    // 3. Rollback assertion: Label removed
    project = useStore.getState().projects.find((p) => p.id === mockProjectId);
    expect(project?.labels).toHaveLength(0);
    expect(useStore.getState().toasts[0].message).toContain("Failed to create label");
  });

  it("enforces MAX_LABELS_PER_PROJECT quota and rejects extra labels", () => {
    const fullLabels: FrontendLabel[] = Array.from(
      { length: MAX_LABELS_PER_PROJECT },
      (_, i) => ({
        id: `label-${i}`,
        name: `Label ${i}`,
        color: "#00ff00",
        projectId: mockProjectId,
      })
    );

    useStore.setState({
      projects: [
        {
          id: mockProjectId,
          name: "Test Project",
          tasks: [],
          labels: fullLabels,
          tasksLoaded: true,
        },
      ],
    });

    // Act: Attempt to add 21st label
    useStore.getState().addLabelToProject({
      id: "overflow-label",
      name: "Excess",
      color: "#ffffff",
      projectIds: [mockProjectId],
    });

    const project = useStore.getState().projects.find((p) => p.id === mockProjectId);
    expect(project?.labels).toHaveLength(MAX_LABELS_PER_PROJECT);
    expect(labelActions.createLabel).not.toHaveBeenCalled();
  });

  it("optimistically deletes label with cascading removal from tasks and rolls back on failure", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    (labelActions.deleteLabel as jest.Mock).mockRejectedValueOnce(new Error("Delete failed"));

    const labelTarget: FrontendLabel = { id: "l-target", name: "Target", color: "#ff0000", projectId: mockProjectId };
    const labelKeep: FrontendLabel = { id: "l-keep", name: "Keep", color: "#0000ff", projectId: mockProjectId };

    const tasks = [
      { id: "task-1", title: "Task 1", done: false, priority: "mid" as const, labels: ["l-target", "l-keep"], projectId: mockProjectId, orderIndex: 0 },
      { id: "task-2", title: "Task 2", done: false, priority: "low" as const, labels: ["l-target"], projectId: mockProjectId, orderIndex: 1 },
    ];

    useStore.setState({
      labelsFilter: ["l-target"],
      projects: [
        {
          id: mockProjectId,
          name: "Test Project",
          tasks,
          labels: [labelTarget, labelKeep],
          tasksLoaded: true,
        },
      ],
    });

    // Act: Delete label "l-target"
    useStore.getState().deleteLabel("l-target");

    // 1. Optimistic assertion:
    // - Label removed from project
    let project = useStore.getState().projects.find((p) => p.id === mockProjectId);
    expect(project?.labels).toHaveLength(1);
    expect(project?.labels[0].id).toBe("l-keep");

    // - Cascading removal: stripped from tasks
    expect(project?.tasks[0].labels).toEqual(["l-keep"]);
    expect(project?.tasks[1].labels).toEqual([]);

    // - Stripped from active labelsFilter
    expect(useStore.getState().labelsFilter).toEqual([]);

    // 2. Wait for async error rollback
    await new Promise(process.nextTick);

    // 3. Rollback assertion:
    project = useStore.getState().projects.find((p) => p.id === mockProjectId);
    // - Label restored to project
    expect(project?.labels).toHaveLength(2);
    expect(project?.labels.map((l) => l.id)).toContain("l-target");

    // - Label re-attached to affected tasks
    expect(project?.tasks[0].labels).toContain("l-target");
    expect(project?.tasks[1].labels).toContain("l-target");

    // - labelsFilter restored
    expect(useStore.getState().labelsFilter).toContain("l-target");
    expect(useStore.getState().toasts[0].message).toContain("Failed to delete label");
  });
});
