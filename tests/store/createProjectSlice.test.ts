import useStore from "@/frontend/store/useStore";
import * as projectActions from "@/backend/actions/projectActions";
import * as taskActions from "@/backend/actions/taskActions";
import { MAX_PROJECTS_PER_USER } from "@/frontend/constants";

// Mock backend actions so unit tests isolate frontend store logic
jest.mock("@/backend/actions/projectActions", () => ({
  getProjects: jest.fn(),
  createProject: jest.fn(),
  deleteProject: jest.fn(),
  updateProject: jest.fn(),
}));

jest.mock("@/backend/actions/taskActions", () => ({
  getProjectTasks: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  deleteAllTasks: jest.fn(),
}));

jest.mock("@/backend/actions/labelActions", () => ({
  createLabel: jest.fn(),
  deleteLabel: jest.fn(),
  deleteAllLabels: jest.fn(),
  updateLabel: jest.fn(),
}));

describe("createProjectSlice", () => {
  const mockUserId = "user-test-123";
  const projectAId = "project-a";
  const projectBId = "project-b";

  beforeEach(() => {
    // Reset store state before each test
    useStore.setState({
      activeUserId: mockUserId,
      activeProjectId: projectAId,
      isLoadingTasks: false,
      projects: [
        {
          id: projectAId,
          name: "Project A",
          tasks: [],
          labels: [],
          tasksLoaded: true,
        },
        {
          id: projectBId,
          name: "Project B",
          tasks: [],
          labels: [],
          tasksLoaded: false, // Tasks not yet loaded (lazy-load candidate)
        },
      ],
      toasts: [],
    });

    jest.clearAllMocks();
  });

  it("lazy-loads tasks when an un-cached project is selected", async () => {
    const mockTasks = [
      {
        id: "task-b1",
        title: "Loaded Task for Project B",
        done: false,
        priority: "mid",
        labels: [],
        projectId: projectBId,
        orderIndex: 0,
      },
    ];

    (taskActions.getProjectTasks as jest.Mock).mockResolvedValueOnce(mockTasks);

    // Act: Switch active project to Project B
    useStore.getState().setActiveProjectId(projectBId);

    // Verify loading indicator is active during fetch
    // Then wait for async fetchProjectTasks to resolve
    await new Promise(process.nextTick);

    // Assert: getProjectTasks was called once with the target project ID
    expect(taskActions.getProjectTasks).toHaveBeenCalledTimes(1);
    expect(taskActions.getProjectTasks).toHaveBeenCalledWith(projectBId, mockUserId);

    // Assert: Project B in store now contains the fetched tasks and is marked as loaded
    const projectB = useStore.getState().projects.find((p) => p.id === projectBId);
    expect(projectB?.tasksLoaded).toBe(true);
    expect(projectB?.tasks).toHaveLength(1);
    expect(projectB?.tasks[0].title).toBe("Loaded Task for Project B");
    expect(useStore.getState().activeProjectId).toBe(projectBId);
  });

  it("skips network call and uses in-memory cache when project tasks are already loaded", async () => {
    // Project A has tasksLoaded: true initially
    expect(useStore.getState().projects.find((p) => p.id === projectAId)?.tasksLoaded).toBe(true);

    // Act: Fetch tasks for Project A
    await useStore.getState().fetchProjectTasks(projectAId);

    // Assert: No network request was made because of cache hit
    expect(taskActions.getProjectTasks).not.toHaveBeenCalled();
  });

  it("enforces MAX_PROJECTS_PER_USER quota when trying to add too many projects", () => {
    const maxProjects = Array.from({ length: MAX_PROJECTS_PER_USER }, (_, i) => ({
      id: `proj-${i}`,
      name: `Project ${i}`,
      tasks: [],
      labels: [],
      tasksLoaded: true,
    }));

    useStore.setState({ projects: maxProjects });

    // Act: Attempt to add another project beyond quota
    useStore.getState().addProject("Excess Project");

    // Assert: Projects count remains at max quota and backend is not called
    expect(useStore.getState().projects).toHaveLength(MAX_PROJECTS_PER_USER);
    expect(projectActions.createProject).not.toHaveBeenCalled();
  });

  it("optimistically adds project and rolls back with error toast on backend failure", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    (projectActions.createProject as jest.Mock).mockRejectedValueOnce(
      new Error("Failed to insert project")
    );

    // Act: Add new project
    useStore.getState().addProject("New Client Website");

    // 1. Optimistic assertion: New project is immediately present
    expect(useStore.getState().projects).toHaveLength(3);
    const addedProject = useStore.getState().projects.find(
      (p) => p.name === "New Client Website"
    );
    expect(addedProject).toBeDefined();
    expect(useStore.getState().activeProjectId).toBe(addedProject?.id);

    // 2. Wait for async rejection and rollback
    await new Promise(process.nextTick);

    // 3. Rollback assertion: Project was removed and active project reverted to previous
    expect(useStore.getState().projects).toHaveLength(2);
    expect(
      useStore.getState().projects.find((p) => p.name === "New Client Website")
    ).toBeUndefined();
    expect(useStore.getState().activeProjectId).toBe(projectAId);

    // 4. Toast assertion: Error toast was shown
    const toasts = useStore.getState().toasts;
    expect(toasts.length).toBeGreaterThan(0);
    expect(toasts[0].type).toBe("error");
    expect(toasts[0].message).toContain("Failed to create project");
  });
});
