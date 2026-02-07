import "./label.css";

function Label({ label, deleteLabel }) {
  return (
    <div className="label-item">
      <span
        className="label"
        style={{ backgroundColor: label.color,  color: "black"}}
      >
        {label.name}
      </span>
      <button onClick={deleteLabel}>X</button>
    </div>
  );
}

export default Label;
