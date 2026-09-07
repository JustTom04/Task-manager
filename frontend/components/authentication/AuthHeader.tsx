"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import "@/frontend/styles/components/authentication.css";
import AuthModal from "./AuthModal";
import { AnimatePresence } from "framer-motion";

export default function AuthHeader() {
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [showEmailTooltip, setShowEmailTooltip] = useState(false);
  const profileInfoRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (profileInfoRef.current && !(profileInfoRef.current as HTMLElement).contains(event.target as Node)) {
        setShowEmailTooltip(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    // iOS Safari requires touchstart for perfect document clicking
    document.addEventListener("touchstart", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Extract user info if logged in
  const email = session?.user?.email || "";
  const username = email ? email.split('@')[0] : "";
  const initial = username ? username.charAt(0).toUpperCase() : "?";

  return (
    <div className="auth-header-container">
      {session ? (
        <div className="user-profile-card">
          <div 
            className="user-profile-info" 
            onClick={() => setShowEmailTooltip(!showEmailTooltip)}
            style={{ position: "relative" }}
            ref={profileInfoRef}
          >
            <div className="user-avatar">{initial}</div>
            <span className="user-name">{username}</span>
            
            <div className={`custom-email-tooltip ${showEmailTooltip ? 'show' : ''}`}>
              {email}
            </div>
          </div>
          <button
            className="auth-button logout"
            onClick={async () => {
              await signOut({ redirect: false });
              window.location.reload();
            }}
          >
            Log Out
          </button>
        </div>
      ) : (
        <button
          className="auth-button"
          onClick={() => setShowModal(true)}
        >
          Log In
        </button>
      )}
      
      <AnimatePresence>
        {showModal && <AuthModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
