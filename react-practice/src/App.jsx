import { useState } from "react";
import Task from "./Task.jsx";
import "./styles.css";

function App() {
  const [tasks, setTasks] = useState([
    { title: "Programming", done: false, priority: "high" },
    { title: "Work out", done: false, priority: "mid" },
    { title: "Learning English", done: false, priority: "low" }
  ]);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Új task létrehozásához
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("mid");

  const toggleTask = (index) => {
    const newTasks = [...tasks];
    newTasks[index].done = !newTasks[index].done;
    setTasks(newTasks);
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setTasks([...tasks, { title: newTitle, done: false, priority: newPriority }]);
    setNewTitle("");
  };

  const filteredTasks = tasks.filter((task) => {
    const statusMatch =
      statusFilter === "ALL" ||
      (statusFilter === "Finished" && task.done) ||
      (statusFilter === "On working" && !task.done);
    const priorityMatch =
      priorityFilter === "ALL" || task.priority.toLowerCase() === priorityFilter.toLowerCase();
    return statusMatch && priorityMatch;
  });

  return (
    <div className="app-container">
      <h1>Task Manager</h1>

      {/* Filterek */}
      <div>
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
      </div>

      {/* Új task form */}
      <form onSubmit={addTask} className="add-task">
        <input
          type="text"
          placeholder="Task title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <select value={newPriority} className="add-task-selection" onChange={(e) => setNewPriority(e.target.value)}>
          <option value="high">High</option>
          <option value="mid">Mid</option>
          <option value="low">Low</option>
        </select>
        <button type="submit" className="task-button undone">Add Task</button>
      </form>

      {/* Task lista */}
      {filteredTasks.map((task, index) => (
        <Task key={index} task={task} toggleTask={() => toggleTask(index)} />
      ))}
    </div>
  );
}

export default App;
