import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

export const metadata = {
  title: "Verify Email - Task Manager",
};

export default function VerifyEmailPage() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#09090b",
      padding: "20px",
      fontFamily: "var(--font-geist-sans), sans-serif",
    }}>
      <Suspense fallback={
        <div style={{
          backgroundColor: "#18181b",
          border: "1px solid #27272a",
          borderRadius: "16px",
          padding: "36px",
          maxWidth: "460px",
          width: "100%",
          textAlign: "center",
          color: "#a1a1aa",
        }}>
          Loading verification...
        </div>
      }>
        <VerifyEmailClient />
      </Suspense>
    </main>
  );
}
