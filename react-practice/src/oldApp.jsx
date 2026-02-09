import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Task from "./Task.jsx";
import Label from "./Label.jsx"
import ColorPicker from "./colorPicker.jsx";
import ProjectPicker from "./projectPicker.jsx";

import { useTasks } from "./useTasks.js";
import { useProjects } from "./useProjects.js";

import "./styles.css";
import "./general.css";
import { useClickOutside } from "./utils.js";


function App() {
  // ===== State-ek =====
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [labelsFilter, setLabelsFilter] = useState([]);
  const [filterlabelsOpen, setFilterLabelsOpen] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("mid");

  

  // ===== Ref-ek =====
  const newTitleRef = useRef(null);
  const lastTaskRef = useRef(null); 
  const labelsRef = useRef(null);
  const filterLabelsRef = useRef(null);






  // ===== Selected project tasks =====
  const actualTasksList = useMemo(() => {
    const project = projects.find(p => p.id === activeProjectId);
    return project ? project.tasks : [];
  }, [projects, activeProjectId]);


  const actualLabelsList = useMemo(() => {
    const project  = projects.find(p => p.id === activeProjectId);
    return project ? project.labels : [];
  }, [projects, activeProjectId])


  // ===== Completed tasks counter =====
  const completedCount = actualTasksList.filter(t => t.done).length;


  useClickOutside(labelsRef, () => setLabelsOpen(false));
  useClickOutside(filterLabelsRef, () => setFilterLabelsOpen(false));



  // ===== Task manipuláló függvények =====
  const toggleTask = useCallback((id) => {
    setProjects(prev => prev.map(p =>
      p.id === activeProjectId
        ? { ...p, tasks: p.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) }
        : p
    ));
  }, []);

  const deleteTask = useCallback((id) => {
    setProjects(prev => prev.map(p =>
      p.id === activeProjectId
        ? { ...p, tasks: p.tasks.filter(t => t.id !== id) }
        : p
    ));

    localStorage.removeItem(`task-${id}-seconds`);
  }, []);

  const updateTask = useCallback((id, updatedTask) => {
      setProjects(prev => prev.map(p =>
      p.id === activeProjectId
        ? { ...p, tasks: p.tasks.map(t => t.id === id ? { ...t, ...updatedTask } : t) }
        : p
    ));
  }, []);

  const deleteAllTasks = useCallback(() => {
    setProjects(prev => prev.map(p =>
      p.id === activeProjectId ? { ...p, tasks: [] } : p
    ));
  }, []);

  // ===== Add new task =====
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
    setProjects(prev => prev.map(p =>
      p.id === activeProjectId ? { ...p, tasks: [...p.tasks, newTask] } : p
    ));

    setNewTitle("");
    newTitleRef.current.focus();
  };

  // ===== Scroll to last task =====
  useEffect(() => {
    if (lastTaskRef.current) {
      lastTaskRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [actualTasksList]);

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
      labelsFilter.length === 0 || task.labels.some(labelId => labelsFilter.includes(labelId)); // legalább egy egyezik

    return statusMatch && priorityMatch && labelsMatch;
  });
}, [actualTasksList, statusFilter, priorityFilter, labelsFilter]);


  return (
    <div className="app-container">
      <h1 id="title">Task Manager</h1>

      {/* ===== Felső rész: filterek, új task, counter ===== */}
      <div className="top-section">
        <div className="filters">
          <label>Status: </label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All</option>
            <option value="Finished">Finished</option>
            <option value="On working">On working</option>
          </select>

          <label>Priority: </label>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
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
              onClick={() => setFilterLabelsOpen(prev => !prev)}
            >
              select labels
            </button>

            {filterlabelsOpen && (
              <div className="labels-dropdown">
                {actualLabelsList.map(label => (
                  <label key={label.id} className="labels-item">
                    <input
                      type="checkbox"
                      checked={labelsFilter.includes(label.id)}
                      onChange={() => {
                        setLabelsFilter(prev =>
                          prev.includes(label.id)
                            ? prev.filter(id => id !== label.id)
                            : [...prev, label.id]
                        );
                      }}
                    />
                    <Label key={label.id} label={label} deleteLabel={() => deleteLabel(label.id)} />
                  </label>
                ))}
              </div>
            )}
          </div>

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


          {/* ===== Project selector ===== */}
            <label>Project: </label>
            <select
              value={activeProjectId}
              onChange={(e) => setActiveProjectId(e.target.value)}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>


          <span style={{ marginLeft: "20px", fontWeight: "bold" }}>
            Completed: {completedCount}/{actualTasksList.length}
          </span>

          <button
            onClick={deleteAllTasks}
            className="button-delete">
          
            Delete All
          </button>
        </div>

        {/* Új task form */}
        <form onSubmit={addTask} className="add-task">
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
              onClick={() => setLabelsOpen(prev => !prev)}
            >
              Add labels
            </button>

            {labelsOpen && (
              <div className="labels-dropdown">
                {labels.map(label => (
                  <label key={label.id} className="labels-item">
                    <input
                      type="checkbox"
                      checked={selectedLabels.includes(label.id)}
                      onChange={() => {
                        setSelectedLabels(prev =>
                          prev.includes(label.id)
                            ? prev.filter(id => id !== label.id)
                            : [...prev, label.id]
                        );
                      }}
                    />
                    <Label key={label.id} label={label} />
                  </label>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="task-button done">
            Add Task
          </button>

        </form>
      </div>

      {/* ===== Görgethető Task lista ===== */}
      <div className="task-list-container">
        {filteredTasks.map((task, index) => {
          const isLast = index === filteredTasks.length - 1;
          return (
            <Task
              key={task.id}
              task={task}
              toggleTask={() => toggleTask(task.id)}
              deleteTask={() => deleteTask(task.id)}
              updateTask={(updatedTask) => updateTask(task.id, updatedTask)}
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
              })
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
                color: result.color,
                tasks: [],
                labels: generalLabels.map(l => ({ ...l })) // klónozzuk, hogy független legyen
              };
              setProjects(prev => [...prev, newProject]);
              setActiveProjectId(newProject.id);
            }
          }}
        />
      )}

    </div>

  );
}

export default App;
