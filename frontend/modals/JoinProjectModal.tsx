import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { MODAL_ANIMATION } from "@/frontend/constants";
import { useModalKeyboard } from "@/frontend/utils";
import "@/frontend/styles/components/authentication.css";

interface JoinProjectModalProps {
  onJoin: (code: string) => Promise<void>;
  onCancel: () => void;
}

function JoinProjectModal({ onJoin, onCancel }: JoinProjectModalProps) {
  const [code, setCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useModalKeyboard(modalRef, onCancel, isJoining);

  useEffect(() => {
    // Focus the input when modal opens
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleJoin = async () => {
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      setError("Please enter a share code.");
      return;
    }
    if (trimmedCode.length !== 6) {
      setError("The code must be exactly 6 characters.");
      return;
    }

    setError(null);
    setIsJoining(true);
    try {
      await onJoin(trimmedCode);
    } catch (err: any) {
      setError(err.message || "Failed to join the project.");
      setIsJoining(false);
    }
  };

  return createPortal(
    <motion.div 
      className="modal-overlay" 
      onMouseDown={!isJoining ? onCancel : undefined}
      {...MODAL_ANIMATION.overlay}
    >
      <motion.div 
        ref={modalRef}
        className="modal" 
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-project-title"
        aria-describedby="join-project-desc"
        onMouseDown={(e) => e.stopPropagation()} 
        onClick={(e) => e.stopPropagation()}
        {...MODAL_ANIMATION.content}
      >
        <h2 id="join-project-title">Join Project</h2>
        <p id="join-project-desc">Enter the 6-character code you received to join.</p>
        
        <input
          ref={inputRef}
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          maxLength={6}
          placeholder="e.g. A7X9WQ"
          aria-label="6-character project share code"
          aria-invalid={Boolean(error)}
          disabled={isJoining}
          className={`search-input ${error ? "input-error shake-animation" : ""}`}
          style={{ width: "100%", marginBottom: "15px", textTransform: "uppercase", textAlign: "center", letterSpacing: "2px", fontWeight: "bold" }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isJoining) handleJoin();
          }}
        />

        {error && (
          <div className="auth-error-box" role="alert" style={{ marginBottom: "15px" }}>
            <span className="auth-error-icon" aria-hidden="true">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="modal-actions">
          <button
            className="task-button done"
            onClick={handleJoin}
            disabled={isJoining}
          >
            {isJoining ? "Joining..." : "Join"}
          </button>
          <button 
            className="task-button undone" 
            onClick={onCancel}
            disabled={isJoining}
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

export default JoinProjectModal;
