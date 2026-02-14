import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Task from "./Task.jsx";
import LabelsPanel from "./LabelsPanel.jsx";
import ColorPicker from "./ColorPicker.jsx";
import ProjectPicker from "./ProjectPicker.jsx";
import ConfirmModal from "./ConfirmModal.jsx";
import SettingsPanel from "./SettingsPanel.jsx";

import { useClickOutside } from "./utils.js";

import "./styles.css";
import "./general.css";
import "./colorPicker.css";
import "./label.css";
import "./settingsPanel.css";



function App() {
  // ===== States =====
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [labelsOpen, setLabelsOpen] = useState(false);

  const [labelsFilter, setLabelsFilter] = useState([]);
  const [filterlabelsOpen, setFilterLabelsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("mid");

  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);


  // ===== Ref =====
  const newTitleRef = useRef(null);
  const lastTaskRef = useRef(null);
  const labelsRef = useRef(null);
  const filterLabelsRef = useRef(null);

  // ===== Projects =====
  const initialProjects = () => {
    const saved = localStorage.getItem("projects");
    if (saved) return JSON.parse(saved);

    return [
      {
        id: crypto.randomUUID(),
        name: "General",
        tasks: [
          { id: 1, title: "Programming", done: false, priority: "high", labels: [1, 2] },
          { id: 2, title: "Work out", done: false, priority: "mid", labels: [1, 2], },
          { id: 3, title: "Learning English", done: false, priority: "low", labels: [1, 2], },
        ],
        labels: [
          { id: 1, name: "Work", color: "#f28b82" },
          { id: 2, name: "Personal", color: "#fbbc04" },
          { id: 3, name: "Urgent", color: "#34a853" },
        ],
      },
    ];
  };

  const [projects, setProjects] = useState(initialProjects());
  const savedProjectId = localStorage.getItem("activeProjectId");
  const [activeProjectId, setActiveProjectId] = useState(
    savedProjectId || projects[0].id
  );

  const actualProject = useMemo(() => {
    return projects.find(p => p.id === activeProjectId);
  }, [projects, activeProjectId]);

  

  useEffect(
    () => localStorage.setItem("projects", JSON.stringify(projects)),
    [projects]
  );

  useEffect(
    () => localStorage.setItem("activeProjectId", activeProjectId),
    [activeProjectId]
  );

  // ===== Tasks and Labels for current project =====
  const actualTasksList = useMemo(() => {
    return actualProject?.tasks || [];
  }, [projects, activeProjectId]);

  const actualLabelsList = useMemo(() => {
    return actualProject?.labels || [];
  }, [projects, activeProjectId]);

  // ===== Completed tasks counter =====
  const completedCount = actualTasksList.filter((t) => t.done).length;

  useClickOutside(labelsRef, () => setLabelsOpen(false));
  useClickOutside(filterLabelsRef, () => setFilterLabelsOpen(false));

    // ===== Scroll to last task =====
  useEffect(() => {
    if (lastTaskRef.current) {
      lastTaskRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [actualTasksList]);


  // ===== Label functions =====
  const deleteLabel = useCallback(
    (id) => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === activeProjectId
            ? {
                ...p,
                labels: p.labels.filter((label) => label.id !== id),
                tasks: p.tasks.map((task) => ({
                  ...task,
                  labels: task.labels.filter((lid) => lid !== id),
                })),
              }
            : p
        )
      );
    },
    [activeProjectId]
  );

  const deleteAllLabels = useCallback(() => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId ? { ...p, labels: [] } : p
      )
    );
  }, [activeProjectId]);

  const addLabelToProject = useCallback(
    (newLabel) => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === activeProjectId
            ? { ...p, labels: [...(p.labels || []), newLabel] }
            : p
        )
      );
    },
    [activeProjectId]
  );

  // ===== Task functions =====
  const toggleTask = useCallback((id) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === id ? { ...t, done: !t.done } : t
              ),
            }
          : p
      )
    );
  }, [activeProjectId]);

  const deleteTask = useCallback((id) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? { ...p, tasks: p.tasks.filter((t) => t.id !== id) }
          : p
      )
    );
    localStorage.removeItem(`task-${id}-seconds`);
  }, [activeProjectId]);

  const updateTask = useCallback((id, updatedTask) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === id ? { ...t, ...updatedTask } : t
              ),
            }
          : p
      )
    );
  }, [activeProjectId]);

  const deleteAllTasks = useCallback(() => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId ? { ...p, tasks: [] } : p
      )
    );
  }, [activeProjectId]);

  const addTask = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask = {
      id: crypto.randomUUID(),
      title: newTitle,
      done: false,
      priority: newPriority,
      labels: selectedLabels,
    };

    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? { ...p, tasks: [...p.tasks, newTask] }
          : p
      )
    );

    setNewTitle("");
    newTitleRef.current.focus();
  };



  // ===== Filtered tasks =====
  const filteredTasks = useMemo(() => {
    return actualTasksList.filter((task) => {
      const statusMatch =
        statusFilter === "ALL" ||
        (statusFilter === "Finished" && task.done) ||
        (statusFilter === "On working" && !task.done);

      const priorityMatch =
        priorityFilter === "ALL" ||
        task.priority.toLowerCase() === priorityFilter.toLowerCase();

      const labelsMatch =
        labelsFilter.length === 0 ||
        task.labels.some((labelId) => labelsFilter.includes(labelId));

      return statusMatch && priorityMatch && labelsMatch;
    });
  }, [actualTasksList, statusFilter, priorityFilter, labelsFilter]);


  return (
    <div className="app-container">
      <div id="title-row">
        <h1 id="title">{actualProject.name}</h1>

        <span id="completed-counter">
          Completed: {completedCount}/{actualTasksList.length}
        </span>
      </div>

      {/* ===== Top section ===== */}
      <div className="top-section">
        <div className="row">
          
          {/* ===== Filters ===== */}
          <div className="section">
            <label>Status: </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="Finished">Finished</option>
              <option value="On working">On working</option>
            </select>

            <label>Priority: </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="high">High</option>
              <option value="mid">Mid</option>
              <option value="low">Low</option>
            </select>

            <div className="labels-select" ref={filterLabelsRef}>
              <button
                type="button"
                className="labels-button"
                id="filter-labels-button"
                onClick={() => setFilterLabelsOpen((prev) => !prev)}
              >
                select labels
              </button>

              {filterlabelsOpen && (
                <LabelsPanel
                  labels={actualLabelsList}
                  selectedIds={labelsFilter}
                  setSelectedIds={setLabelsFilter}
                  showDelete={true}
                  deleteLabel={deleteLabel}
                />
              )}

            </div>
          </div>


          <div className="section">
            <button
              className="task-button done"
              onClick={() => setShowLabelModal(true)}
            >
              ➕ Create Label
            </button>

            <button
              className="task-button done"
              onClick={() => setShowProjectModal(true)}
            >
              ➕ Add Project
            </button>
          </div>

        </div>

        <div className="row">
        {/* ===== Add new task ===== */}
          <form onSubmit={addTask} className="section">
            <input
              type="text"
              placeholder="Task title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              ref={newTitleRef}
            />

            <select
              value={newPriority}
              className="add-task-selection"
              onChange={(e) => setNewPriority(e.target.value)}
            >
              <option value="high">High</option>
              <option value="mid">Mid</option>
              <option value="low">Low</option>
            </select>

            <div className="labels-select" ref={labelsRef}>
              <button
                type="button"
                className="labels-button"
                onClick={() => setLabelsOpen((prev) => !prev)}
              >
                Add labels
              </button>

              {labelsOpen && (
                  <LabelsPanel
                    labels={actualLabelsList}
                    selectedIds={selectedLabels}
                    setSelectedIds={setSelectedLabels}
                    showDelete={false}
                  /> 
              )}
            </div>

            <button type="submit" className="task-button done">
              Add Task
            </button>
          </form>

          <div className="section">
            <button
              onClick={() =>
                setConfirmAction(() => deleteAllTasks)
              }
                className={`button-delete ${
                  actualTasksList.length === 0 ? "inactive" : ""
                }`}
                disabled={actualTasksList.length === 0}
            >
              Delete All
            </button>

            <button
              onClick={() =>
                setConfirmAction(() => deleteAllLabels)
              }
                className={`button-delete ${
                  actualLabelsList.length === 0 ? "inactive" : ""
                }`}
                disabled={actualLabelsList.length === 0}
            >
              Delete All labels
            </button>
          </div>
        </div>

      </div>

      {/* ===== Tasks list ===== */}
      <div className="task-list-container">
        {filteredTasks.map((task, index) => {
          const isLast = index === filteredTasks.length - 1;
          return (
            <Task
              key={task.id}
              task={task}
              toggleTask={() => toggleTask(task.id)}
              deleteTask={() => deleteTask(task.id)}
              updateTask={(updatedTask) =>
                updateTask(task.id, updatedTask)
              }
              allLabels={actualLabelsList}
              ref={isLast ? lastTaskRef : null}
            />
          );
        })}
      </div>

      {showLabelModal && (
        <ColorPicker
          onClose={(result) => {
            setShowLabelModal(false);
            if (result) {
              addLabelToProject({
                id: crypto.randomUUID(),
                name: result.name,
                color: result.color,
              });
            }
          }}
        />
      )}

      {showProjectModal && (
        <ProjectPicker
          onClose={(result) => {
            setShowProjectModal(false);
            if (result) {
              const generalLabels = projects[0]?.labels || [];
              const newProject = {
                id: crypto.randomUUID(),
                name: result.name,
                tasks: [],
                labels: generalLabels.map((l) => ({ ...l })),
              };
              setProjects((prev) => [...prev, newProject]);
              setActiveProjectId(newProject.id);
            }
          }}
        />
      )}

      {confirmAction && (
        <ConfirmModal
          title="Are you sure?"
          message="This action cannot be undone."
          onConfirm={confirmAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      <SettingsPanel
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={setActiveProjectId}
      />

    </div>
  );
}

export default App;
