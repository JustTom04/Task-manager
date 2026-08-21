"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import "@/frontend/styles/components/authentication.css";
import AuthModal from "./AuthModal";

export default function AuthHeader() {
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="auth-header-container">
      {session ? (
        <button
          className="auth-button logout"
          onClick={async () => {
            await signOut({ redirect: false });
            window.location.reload();
          }}
        >
          Log Out
        </button>
      ) : (
        <button
          className="auth-button"
          onClick={() => setShowModal(true)}
        >
          Log In
        </button>
      )}
      
      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
