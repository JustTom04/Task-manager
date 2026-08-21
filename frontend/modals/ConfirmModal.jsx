import { createPortal } from "react-dom";

function ConfirmModal({ title, message, onConfirm, onCancel, confirmText = "Yes", cancelText = "Cancel", disabled = false }) {
  
  return createPortal(
    <div className="modal-overlay" onClick={!disabled ? onCancel : undefined}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p>{message}</p>

        <div className="modal-actions">
          <button
            className="task-button done"
            onClick={onConfirm}
            disabled={disabled}
          >
            {disabled ? "Processing..." : confirmText}
          </button>
          <button 
            className="task-button undone" 
            onClick={onCancel}
            disabled={disabled}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ConfirmModal;