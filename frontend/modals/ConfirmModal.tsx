import { createPortal } from "react-dom";

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  disabled?: boolean;
}

function ConfirmModal({ title, message, onConfirm, onCancel, confirmText = "Yes", cancelText = "Cancel", disabled = false }: ConfirmModalProps) {
  
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