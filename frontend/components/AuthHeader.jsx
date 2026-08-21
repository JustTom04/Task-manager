"use client";

import React from "react";
import { useSession } from "next-auth/react";
import "@/frontend/styles/components/authentication.css";

export default function AuthHeader() {
  const { data: session } = useSession();

  return (
    <div className="auth-header-container">
      {session ? (
        <button
          className="auth-button logout"
          onClick={() => alert("Logout will be implemented in Phase 2")}
        >
          Log Out
        </button>
      ) : (
        <button
          className="auth-button"
          onClick={() => alert("Login Modal will be implemented in Phase 2")}
        >
          Log In
        </button>
      )}
    </div>
  );
}
