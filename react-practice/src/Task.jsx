import { useState, useEffect } from "react";
import "./styles.css";

function Task({ task, toggleTask }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (task.done) return; 
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval); // tisztítás az új kör elöttt
  }, [task.done]);

  // Szín a prioritás alapján
  let color;
  switch (task.priority) {
    case "high":
      color = "red";
      break;
    case "mid":
      color = "orange";
      break;
    default:
      color = "green";
  }

  return (
    <div className="task-item">
      <div>
        <span className={`task-title ${task.done ? "finished" : ""}`} style={{ color }}>
          {task.title} - {task.done ? "Finished ✅" : "On working ❌"}
        </span>
        <span style={{ marginLeft: "10px", fontSize: "0.85rem", color: "#555" }}>
          ⏱ {seconds}s
        </span>
      </div>
      <button
        className={`task-button ${task.done ? "done" : "undone"}`}
        onClick={toggleTask}
      >
        {task.done ? "Mark Undone" : "Mark Done"}
      </button>
    </div>
  );
}

export default Task;
