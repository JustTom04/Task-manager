import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Task from "./Task.jsx";
import Label from "./Label.jsx"
import ColorPicker from "./colorPicker.jsx";

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

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("mid");

  // ===== Ref-ek =====
  const newTitleRef = useRef(null);
  const lastTaskRef = useRef(null); 
  const labelsRef = useRef(null);
  const filterLabelsRef = useRef(null);

  // Tasks handle localStorage
  const initialTasks = () => {
    const saved = localStorage.getItem("tasks");
    return saved
      ? JSON.parse(saved)
      : [
          { id: 1, title: "Programming", done: false, priority: "high", labels: [1, 2] },
          { id: 2, title: "Work out", done: false, priority: "mid", labels: [1, 2] },
          { id: 3, title: "Learning English", done: false, priority: "low", labels: [1, 2] },
        ];
  };
  const [tasks, setTasks] = useState(initialTasks());

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);


  // Labels handle localstorage
  const initialLabels = () => {
    const saved = localStorage.getItem("labels");
    return saved ? JSON.parse(saved) :
    [
      { id: 1, name: "Work", color: "#f28b82" },
      { id: 2, name: "Personal", color: "#fbbc04" },
      { id: 3, name: "Urgent", color: "#34a853" },
    ];
  }  

  const [labels, setLabels] = useState(initialLabels());

  useEffect(() => {
    localStorage.setItem("labels", JSON.stringify(labels))
  }, [labels])



  // ===== Completed tasks counter =====
  const [completedCount, setCompletedCount] = useState(0);
  useEffect(() => {
    setCompletedCount(tasks.filter((t) => t.done).length);
  }, [tasks]);


  useClickOutside(labelsRef, () => setLabelsOpen(false));
  useClickOutside(filterLabelsRef, () => setFilterLabelsOpen(false));


  // ===== Label manipuláló függvények =====
  const deleteLabel = useCallback((id) => {
    setLabels((prev) => prev.filter(label => label.id !== id))

    setTasks(prev =>
      prev.map(task =>
        task.labels.includes(id)
          ? { ...task, labels: task.labels.filter(labelId => labelId !== id) }
          : task
      )
    );
  }, [])

  // ===== Task manipuláló függvények =====
  const toggleTask = useCallback((id) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task))
    );
  }, []);

  const deleteTask = useCallback((id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));

    localStorage.removeItem(`task-${id}-seconds`);
  }, []);

  const updateTask = useCallback((id, updatedTask) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updatedTask } : task))
    );
  }, []);

  const deleteAllTasks = useCallback(() => {
    setTasks([]);
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
    setTasks((prev) => [...prev, newTask]);
    setNewTitle("");
    newTitleRef.current.focus();
  };

  // ===== Scroll to last task =====
  useEffect(() => {
    if (lastTaskRef.current) {
      lastTaskRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [tasks]);

  // ===== Filtered tasks =====
const filteredTasks = useMemo(() => {
  return tasks.filter((task) => {
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
}, [tasks, statusFilter, priorityFilter, labelsFilter]);


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
                {labels.map(label => (
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


          <span style={{ marginLeft: "20px", fontWeight: "bold" }}>
            Completed: {completedCount}/{tasks.length}
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
              allLabels={labels}
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
              setLabels((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  name: result.name,
                  color: result.color,
                },
              ]);
            }
          }}
        />
      )}
    </div>

  );
}

export default App;
