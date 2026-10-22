import useStore from "@/frontend/store/useStore";
import * as taskActions from "@/backend/actions/taskActions";
import { MAX_TASKS_PER_PROJECT } from "@/frontend/constants";

// Mock backend action modules so store unit tests don't load backend DB/Auth
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

jest.mock("@/backend/actions/labelActions", () => ({
  createLabel: jest.fn(),
  deleteLabel: jest.fn(),
  deleteAllLabels: jest.fn(),
  updateLabel: jest.fn(),
}));

describe("createTaskSlice", () => {
  const mockUserId = "user-test-123";
  const mockProjectId = "project-test-1";

  beforeEach(() => {
    // Reset store state cleanly before each test
    useStore.setState({
      activeUserId: mockUserId,
      activeProjectId: mockProjectId,
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
      newTitle: "",
      newPriority: "mid",
    });

    jest.clearAllMocks();
  });

  it("optimistically adds a new task to the active project", async () => {
    (taskActions.createTask as jest.Mock).mockResolvedValueOnce({ success: true });

    useStore.getState().addTask("Buy groceries", "high", []);

    const project = useStore.getState().projects.find((p) => p.id === mockProjectId);
    expect(project?.tasks).toHaveLength(1);
    expect(project?.tasks[0].title).toBe("Buy groceries");
    expect(project?.tasks[0].priority).toBe("high");
    expect(project?.tasks[0].done).toBe(false);

    expect(taskActions.createTask).toHaveBeenCalledTimes(1);
    expect(taskActions.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Buy groceries",
        priority: "high",
        projectIds: [mockProjectId],
      }),
      mockUserId
    );
  });

  it("enforces MAX_TASKS_PER_PROJECT quota and rejects new tasks when limit is reached", () => {
    // Pre-fill project with MAX_TASKS_PER_PROJECT (50) tasks
    const fullTasks = Array.from({ length: MAX_TASKS_PER_PROJECT }, (_, i) => ({
      id: `task-${i}`,
      title: `Task ${i}`,
      done: false,
      priority: "mid" as const,
      labels: [],
      projectId: mockProjectId,
      orderIndex: i,
    }));

    useStore.setState({
      projects: [
        {
          id: mockProjectId,
          name: "Test Project",
          tasks: fullTasks,
          labels: [],
          tasksLoaded: true,
        },
      ],
    });

    // Attempt to add a 51st task
    useStore.getState().addTask("Overflow Task", "high", []);

    const project = useStore.getState().projects.find((p) => p.id === mockProjectId);
    expect(project?.tasks).toHaveLength(MAX_TASKS_PER_PROJECT);
    expect(taskActions.createTask).not.toHaveBeenCalled();
  });

  it("performs atomic rollback and displays an error toast when server action fails", async () => {
    // Silence expected console.error log during rollback test
    jest.spyOn(console, "error").mockImplementation(() => {});

    // Backend rejects with an error
    (taskActions.createTask as jest.Mock).mockRejectedValueOnce(
      new Error("Database connection lost")
    );

    useStore.getState().addTask("Failing Task", "mid", []);

    // 1. Optimistic assertion: task is immediately visible in the store
    let project = useStore.getState().projects.find((p) => p.id === mockProjectId);
    expect(project?.tasks).toHaveLength(1);
    expect(project?.tasks[0].title).toBe("Failing Task");

    // 2. Wait for the asynchronous rejection and catch block to execute
    await new Promise(process.nextTick);

    // 3. Rollback assertion: the failed task was removed atomically
    project = useStore.getState().projects.find((p) => p.id === mockProjectId);
    expect(project?.tasks).toHaveLength(0);

    // 4. Toast assertion: error toast was added to store
    const toasts = useStore.getState().toasts;
    expect(toasts.length).toBeGreaterThan(0);
    expect(toasts[0].type).toBe("error");
    expect(toasts[0].message).toContain("Failed to create task");
  });
});
