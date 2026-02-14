
function Label({ label, deleteLabel }) {
  return (
    <div className="label-item">
      <span
        className="label"
        style={{ backgroundColor: label.color}}
      >
        {label.name}
      </span>
      <button onClick={deleteLabel} className="label-delete-button">❌</button>
    </div>
  );
}

export default Label;
