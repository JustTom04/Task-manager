import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { MODAL_ANIMATION } from "@/frontend/constants";

export interface ConfirmConfig {
  action: () => void;
  title: string;
  message: string;
}

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
    <motion.div 
      className="modal-overlay" 
      onMouseDown={!disabled ? onCancel : undefined}
      {...MODAL_ANIMATION.overlay}
    >
      <motion.div 
        className="modal" 
        onMouseDown={(e) => e.stopPropagation()} 
        onClick={(e) => e.stopPropagation()}
        {...MODAL_ANIMATION.content}
      >
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
      </motion.div>
    </motion.div>,
    document.body
  );
}

export default ConfirmModal;