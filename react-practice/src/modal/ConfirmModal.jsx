
function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{title}</h2>
        <p>{message}</p>

        <div className="modal-actions">
          <button
            className="task-button done"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
          >
            Yes
          </button>
          <button className="task-button undone" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
