"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { signIn } from "next-auth/react";
import { registerUser, resendVerificationEmail } from "@/backend/actions/authActions";
import { getUserId, useModalKeyboard } from "@/frontend/utils";
import ConfirmModal from "@/frontend/modals/ConfirmModal";
import { motion } from "framer-motion";
import { MODAL_ANIMATION, AUTH_LIMITS } from "@/frontend/constants";
import "@/frontend/styles/components/authentication.css";

export default function AuthModal({ onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isUnverified, setIsUnverified] = useState(false);
  const [resendStatus, setResendStatus] = useState<string>("");
  const modalRef = useRef<HTMLDivElement>(null);

  useModalKeyboard(modalRef, onClose, loading);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFirstStepSubmit = (e) => {
    e.preventDefault();
    setError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    
    if (!isLogin && password.length < AUTH_LIMITS.PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${AUTH_LIMITS.PASSWORD_MIN_LENGTH} characters long.`);
      return;
    }

    if (isLogin) {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setIsUnverified(false);
    setResendStatus("");
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      if (res.error === "EMAIL_NOT_VERIFIED" || res.code === "EMAIL_NOT_VERIFIED") {
        setError("Your email address is not verified yet. Please check your inbox.");
        setIsUnverified(true);
      } else {
        setError("Invalid email or password.");
      }
      setLoading(false);
    } else {
      window.location.reload();
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResendStatus("Sending...");
    const result = await resendVerificationEmail(email);
    if (result?.success) {
      setResendStatus("Verification email sent! Check your inbox.");
    } else {
      setResendStatus(result?.error || "Failed to resend. Please try again.");
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError("");
    try {
      const registerRes = await registerUser(email, password);
      
      if (registerRes?.error) {
        setError(registerRes.error);
        setLoading(false);
        return;
      }

      setLoading(false);
      setVerificationSent(true);
    } catch (err: any) {
      setError(err?.message || "Failed to register.");
      setLoading(false);
    }
  };

  if (!mounted) return null;

  if (verificationSent) {
    return createPortal(
      <motion.div className="modal-overlay" onMouseDown={onClose} {...MODAL_ANIMATION.overlay}>
        <motion.div
          ref={modalRef}
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          {...MODAL_ANIMATION.content}
        >
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              backgroundColor: "rgba(99, 102, 241, 0.15)",
              color: "#818cf8",
              fontSize: "26px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto"
            }}>
              ✉
            </div>
            <h2 id="auth-modal-title" style={{ marginBottom: "8px" }}>Check your inbox</h2>
            <p style={{ color: "var(--color-text-secondary, #a1a1aa)", fontSize: "14px", lineHeight: "1.5", marginBottom: "20px" }}>
              We sent a verification link to <strong style={{ color: "#fff" }}>{email}</strong>. Please click the link to activate your account.
            </p>
            <button
              type="button"
              className="done auth-submit-btn"
              onClick={() => {
                setVerificationSent(false);
                setIsLogin(true);
              }}
            >
              Back to Log In
            </button>
          </div>
        </motion.div>
      </motion.div>,
      document.body
    );
  }

  return createPortal(
    <motion.div className="modal-overlay" onMouseDown={onClose} {...MODAL_ANIMATION.overlay}>
      <motion.div 
        ref={modalRef}
        className="modal" 
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onMouseDown={(e) => e.stopPropagation()} 
        onClick={(e) => e.stopPropagation()}
        {...MODAL_ANIMATION.content}
      >
        
        <h2 id="auth-modal-title">{isLogin ? "Log In" : "Register"}</h2>

        <form onSubmit={handleFirstStepSubmit} className="auth-form" noValidate>
          <input 
            type="email" 
            placeholder="Email" 
            aria-label="Email address"
            autoComplete="email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            aria-label="Password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="auth-error-box" role="alert">
              <span className="auth-error-icon" aria-hidden="true">⚠️</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span>{error}</span>
                {isUnverified && (
                  <button
                    type="button"
                    onClick={handleResend}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#818cf8",
                      textDecoration: "underline",
                      cursor: "pointer",
                      padding: 0,
                      fontSize: "13px",
                      textAlign: "left",
                      fontWeight: 600,
                    }}
                  >
                    Resend verification email
                  </button>
                )}
                {resendStatus && (
                  <span style={{ fontSize: "12px", color: "#a1a1aa" }}>{resendStatus}</span>
                )}
              </div>
            </div>
          )}
          <button type="submit" className="done auth-submit-btn" disabled={loading}>
            {loading ? "Please wait..." : (isLogin ? "Log In" : "Continue")}
          </button>
        </form>

        <div className="auth-switch">
          <span className="auth-switch-text">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <span
            role="button"
            tabIndex={0}
            onClick={() => setIsLogin(!isLogin)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsLogin(!isLogin);
              }
            }}
            className="auth-switch-link"
          >
            {isLogin ? "Register" : "Log In"}
          </span>
        </div>

      </motion.div>
    </motion.div>,
    document.body
  );
}
