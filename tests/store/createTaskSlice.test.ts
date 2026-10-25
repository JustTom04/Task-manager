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
  getTaskDescription: jest.fn(),
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

  it("optimistically toggles task done status and rolls back on failure", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    (taskActions.updateTask as jest.Mock).mockRejectedValueOnce(new Error("Update failed"));

    const initialTask = {
      id: "toggle-task-1",
      title: "Task to toggle",
      done: false,
      priority: "mid" as const,
      labels: [],
      projectId: mockProjectId,
      orderIndex: 0,
    };

    useStore.setState({
      projects: [
        {
          id: mockProjectId,
          name: "Test Project",
          tasks: [initialTask],
          labels: [],
          tasksLoaded: true,
        },
      ],
    });

    // Act: Toggle task
    useStore.getState().toggleTask("toggle-task-1");

    // 1. Optimistic assertion: done is immediately flipped to true
    let project = useStore.getState().projects.find((p) => p.id === mockProjectId);
    expect(project?.tasks[0].done).toBe(true);

    // 2. Wait for async error rollback
    await new Promise(process.nextTick);

    // 3. Rollback assertion: done is reverted to false
    project = useStore.getState().projects.find((p) => p.id === mockProjectId);
    expect(project?.tasks[0].done).toBe(false);
    expect(useStore.getState().toasts[0].message).toContain("Failed to update task status");
  });

  it("optimistically deletes task and restores it at original index on failure", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    (taskActions.deleteTask as jest.Mock).mockRejectedValueOnce(new Error("Delete failed"));

    const tasks = [
      { id: "t-1", title: "First", done: false, priority: "mid" as const, labels: [], projectId: mockProjectId, orderIndex: 0 },
      { id: "t-2", title: "Target to delete", done: false, priority: "high" as const, labels: [], projectId: mockProjectId, orderIndex: 1 },
      { id: "t-3", title: "Third", done: false, priority: "low" as const, labels: [], projectId: mockProjectId, orderIndex: 2 },
    ];

    useStore.setState({
      projects: [
        {
          id: mockProjectId,
          name: "Test Project",
          tasks,
          labels: [],
          tasksLoaded: true,
        },
      ],
    });

    // Act: Delete middle task (index 1)
    useStore.getState().deleteTask("t-2");

    // 1. Optimistic assertion: t-2 is immediately removed
    let project = useStore.getState().projects.find((p) => p.id === mockProjectId);
    expect(project?.tasks).toHaveLength(2);
    expect(project?.tasks.map((t) => t.id)).toEqual(["t-1", "t-3"]);

    // 2. Wait for async rollback
    await new Promise(process.nextTick);

    // 3. Rollback assertion: t-2 is restored at exact original index (1)
    project = useStore.getState().projects.find((p) => p.id === mockProjectId);
    expect(project?.tasks).toHaveLength(3);
    expect(project?.tasks[1].id).toBe("t-2");
    expect(useStore.getState().toasts[0].message).toContain("Failed to delete task");
  });

  it("optimistically deletes all tasks and restores previous array on failure", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    (taskActions.deleteAllTasks as jest.Mock).mockRejectedValueOnce(new Error("Batch delete failed"));

    const tasks = [
      { id: "t-1", title: "Task 1", done: true, priority: "mid" as const, labels: [], projectId: mockProjectId, orderIndex: 0 },
      { id: "t-2", title: "Task 2", done: true, priority: "low" as const, labels: [], projectId: mockProjectId, orderIndex: 1 },
    ];

    useStore.setState({
      projects: [
        {
          id: mockProjectId,
          name: "Test Project",
          tasks,
          labels: [],
          tasksLoaded: true,
        },
      ],
    });

    // Act: Delete all tasks
    useStore.getState().deleteAllTasks();

    // 1. Optimistic assertion: tasks cleared
    let project = useStore.getState().projects.find((p) => p.id === mockProjectId);
    expect(project?.tasks).toHaveLength(0);

    // 2. Wait for async rollback
    await new Promise(process.nextTick);

    // 3. Rollback assertion: all previous tasks restored
    project = useStore.getState().projects.find((p) => p.id === mockProjectId);
    expect(project?.tasks).toHaveLength(2);
    expect(project?.tasks.map((t) => t.id)).toEqual(["t-1", "t-2"]);
    expect(useStore.getState().toasts[0].message).toContain("Failed to delete all tasks");
  });

  it("optimistically adds a task with a description and clears newDescription state", async () => {
    (taskActions.createTask as jest.Mock).mockResolvedValueOnce({ success: true });
    useStore.setState({ newDescription: "Important meeting notes" });

    useStore.getState().addTask("Prepare slides", "high", [], "Important meeting notes");

    const project = useStore.getState().projects.find((p) => p.id === mockProjectId);
    expect(project?.tasks).toHaveLength(1);
    expect(project?.tasks[0].title).toBe("Prepare slides");
    expect(project?.tasks[0].description).toBe("Important meeting notes");
    expect(project?.tasks[0].hasDescription).toBe(true);
    expect(useStore.getState().newDescription).toBe("");

    expect(taskActions.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Prepare slides",
        priority: "high",
        description: "Important meeting notes",
      }),
      mockUserId
    );
  });

  it("optimistically updates task description and rolls back on failure", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    (taskActions.updateTask as jest.Mock).mockRejectedValueOnce(new Error("Server error"));

    const initialTask = {
      id: "task-desc-1",
      title: "Write documentation",
      done: false,
      priority: "mid" as const,
      labels: [],
      description: "Initial description",
      hasDescription: true,
      projectId: mockProjectId,
      orderIndex: 0,
    };

    useStore.setState({
      projects: [
        {
          id: mockProjectId,
          name: "Test Project",
          tasks: [initialTask],
          labels: [],
          tasksLoaded: true,
        },
      ],
    });

    // Act: Update description to empty string
    useStore.getState().updateTask("task-desc-1", { description: "" });

    // 1. Optimistic assertion: description is cleared, hasDescription is false
    let project = useStore.getState().projects.find((p) => p.id === mockProjectId);
    expect(project?.tasks[0].description).toBe("");
    expect(project?.tasks[0].hasDescription).toBe(false);

    // 2. Wait for async rollback
    await new Promise(process.nextTick);

    // 3. Rollback assertion: initial description and hasDescription restored
    project = useStore.getState().projects.find((p) => p.id === mockProjectId);
    expect(project?.tasks[0].description).toBe("Initial description");
    expect(project?.tasks[0].hasDescription).toBe(true);
    expect(useStore.getState().toasts[0].message).toContain("Failed to save task changes");
  });

  it("lazily loads task description and caches it in the project task state", async () => {
    (taskActions.getTaskDescription as jest.Mock).mockResolvedValueOnce("Detailed research notes");

    const taskWithoutLoadedDesc = {
      id: "task-lazy-1",
      title: "Research competitors",
      done: false,
      priority: "high" as const,
      labels: [],
      hasDescription: true,
      description: undefined,
      projectId: mockProjectId,
      orderIndex: 0,
    };

    useStore.setState({
      projects: [
        {
          id: mockProjectId,
          name: "Test Project",
          tasks: [taskWithoutLoadedDesc],
          labels: [],
          tasksLoaded: true,
        },
      ],
    });

    // Act: Fetch description
    const result = await useStore.getState().loadTaskDescription("task-lazy-1");

    expect(result).toBe("Detailed research notes");
    expect(taskActions.getTaskDescription).toHaveBeenCalledTimes(1);
    expect(taskActions.getTaskDescription).toHaveBeenCalledWith("task-lazy-1", mockUserId);

    // Assert that the store cached the description
    const project = useStore.getState().projects.find((p) => p.id === mockProjectId);
    expect(project?.tasks[0].description).toBe("Detailed research notes");
    expect(project?.tasks[0].hasDescription).toBe(true);

    // Act again: Should return cached description immediately without calling server action again
    const cachedResult = await useStore.getState().loadTaskDescription("task-lazy-1");
    expect(cachedResult).toBe("Detailed research notes");
    expect(taskActions.getTaskDescription).toHaveBeenCalledTimes(1);
  });

  it("handles failure when lazy loading task description", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    (taskActions.getTaskDescription as jest.Mock).mockRejectedValueOnce(new Error("Network failure"));

    const taskToLoad = {
      id: "task-lazy-fail",
      title: "Task with network issue",
      done: false,
      priority: "mid" as const,
      labels: [],
      hasDescription: true,
      description: undefined,
      projectId: mockProjectId,
      orderIndex: 0,
    };

    useStore.setState({
      projects: [
        {
          id: mockProjectId,
          name: "Test Project",
          tasks: [taskToLoad],
          labels: [],
          tasksLoaded: true,
        },
      ],
    });

    const result = await useStore.getState().loadTaskDescription("task-lazy-fail");
    expect(result).toBeNull();
    expect(useStore.getState().toasts[0].message).toContain("Failed to load description");
  });
});
