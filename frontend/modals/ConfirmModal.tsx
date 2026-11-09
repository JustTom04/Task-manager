import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { MODAL_ANIMATION } from "@/frontend/constants";
import { useModalKeyboard } from "@/frontend/utils";

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
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useModalKeyboard(modalRef, onCancel, disabled);

  useEffect(() => {
    confirmBtnRef.current?.focus();
  }, []);

  return createPortal(
    <motion.div 
      className="modal-overlay" 
      onMouseDown={!disabled ? onCancel : undefined}
      {...MODAL_ANIMATION.overlay}
    >
      <motion.div 
        ref={modalRef}
        className="modal" 
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
        onMouseDown={(e) => e.stopPropagation()} 
        onClick={(e) => e.stopPropagation()}
        {...MODAL_ANIMATION.content}
      >
        <h2 id="confirm-modal-title">{title}</h2>
        <p id="confirm-modal-desc">{message}</p>

        <div className="modal-actions">
          <button
            ref={confirmBtnRef}
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