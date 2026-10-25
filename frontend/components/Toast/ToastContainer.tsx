"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useStore from "@/frontend/store/useStore";
import { ToastMessage } from "@/frontend/store/types";
import "@/frontend/styles/components/toast.css";

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  const getIcon = () => {
    switch (toast.type) {
      case "error":
        return (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="4.5" x2="12" y2="13" />
            <line x1="12" y1="18.5" x2="12.01" y2="18.5" />
          </svg>
        );
      case "success":
        return "✓";
      case "info":
      default:
        return "ℹ";
    }
  };

  return (
    <motion.div
      layout
      className={`toast-item toast-${toast.type}`}
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.9, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 450, damping: 30 }}
    >
      <div className="toast-content">
        <span className="toast-icon-badge" aria-hidden="true">
          {getIcon()}
        </span>
        <p className="toast-message">{toast.message}</p>
      </div>
      <button
        type="button"
        className="toast-close-btn"
        onClick={() => onRemove(toast.id)}
        aria-label="Close notification"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </motion.div>
  );
}

export default function ToastContainer() {
  const [mounted, setMounted] = useState(false);
  const toasts = useStore((state) => state.toasts);
  const removeToast = useStore((state) => state.removeToast);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
