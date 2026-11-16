"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import "./verifyEmail.css";

export default function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token was provided.");
      return;
    }

    if (hasTriggered.current) return;
    hasTriggered.current = true;

    async function handleVerifyAndLogin() {
      try {
        const res = await signIn("token-verification", {
          token,
          redirect: false,
        });

        if (res?.error) {
          setStatus("error");
          setErrorMessage("This verification link is invalid, already used, or has expired.");
        } else {
          setStatus("success");
          // Seamless redirect directly into dashboard after 1.5 seconds
          setTimeout(() => {
            router.push("/");
            router.refresh();
          }, 1500);
        }
      } catch (err) {
        setStatus("error");
        setErrorMessage("An unexpected error occurred during verification.");
      }
    }

    handleVerifyAndLogin();
  }, [token, router]);

  return (
    <div className="verify-email-card">
      {status === "loading" && (
        <div>
          <div className="verify-email-spinner" />
          <h1 className="verify-email-title">
            Verifying your email
          </h1>
          <p className="verify-email-description" style={{ marginBottom: 0 }}>
            Please wait a moment while we confirm your email address...
          </p>
        </div>
      )}

      {status === "success" && (
        <div>
          <div className="verify-email-icon success">
            ✓
          </div>
          <h1 className="verify-email-title">
            Email Verified!
          </h1>
          <p className="verify-email-description">
            Your account is now activated. Logging you in automatically...
          </p>
          <Link href="/" className="verify-email-btn primary">
            Go to Task Manager
          </Link>
        </div>
      )}

      {status === "error" && (
        <div>
          <div className="verify-email-icon error">
            ✕
          </div>
          <h1 className="verify-email-title">
            Verification Failed
          </h1>
          <p className="verify-email-error-text">
            {errorMessage}
          </p>
          <Link href="/" className="verify-email-btn secondary">
            Back to Home
          </Link>
        </div>
      )}
    </div>
  );
}

