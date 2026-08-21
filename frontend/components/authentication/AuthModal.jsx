"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { signIn } from "next-auth/react";
import { registerUser } from "@/backend/actions/authActions";
import { getUserId } from "@/frontend/utils";
import ConfirmModal from "@/frontend/modals/ConfirmModal";
import "@/frontend/styles/components/authentication.css";

export default function AuthModal({ onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFirstStepSubmit = (e) => {
    e.preventDefault();
    setError("");
    
    if (isLogin) {
      handleLogin();
    } else {
      setStep(2);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      window.location.reload();
    }
  };

  const handleRegister = async (saveProjects) => {
    setLoading(true);
    setError("");
    try {
      const guestUserId = getUserId();
      await registerUser(email, password, guestUserId, saveProjects);
      
      // Auto login after successful registration
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Registration succeeded but login failed.");
        setLoading(false);
      } else {
        window.location.reload();
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
      setStep(1);
    }
  };

  if (!mounted) return null;

  if (step === 2) {
    return (
      <ConfirmModal
        title="Save Projects?"
        message="Do you want to save your current unlogin projects to your new account?"
        confirmText="Yes, save them"
        cancelText="No, start fresh"
        onConfirm={() => handleRegister(true)}
        onCancel={() => handleRegister(false)}
        disabled={loading}
      />
    );
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        
        <h2>{isLogin ? "Log In" : "Register"}</h2>
        
        {error && <p style={{ color: "#e74c3c", fontSize: "0.9rem", marginTop: "5px" }}>{error}</p>}

        <form onSubmit={handleFirstStepSubmit} className="auth-form">
          <input 
            type="email" 
            placeholder="Email" 
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="done auth-submit-btn" disabled={loading}>
            {loading ? "Please wait..." : (isLogin ? "Log In" : "Continue")}
          </button>
        </form>

        <div className="auth-switch">
          <span className="auth-switch-text">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <span onClick={() => setIsLogin(!isLogin)} className="auth-switch-link">
            {isLogin ? "Register" : "Log In"}
          </span>
        </div>

      </div>
    </div>,
    document.body
  );
}
