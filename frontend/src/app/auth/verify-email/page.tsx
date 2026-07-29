"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    const verify = async () => {
      try {
        const { data } = await api.post("/auth/verify-email", { token });
        setStatus("success");
        setMessage(data.message || "Email verified successfully!");
        setTimeout(() => router.push("/auth/login"), 3000);
      } catch (err: any) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed. The link may be expired.");
      }
    };

    const timer = setTimeout(verify, 500);
    return () => clearTimeout(timer);
  }, [token, router]);

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div>
          <Mail size={64} style={{ margin: "0 auto 24px" }} />
          <h1>Email Verification</h1>
          <p>Verify your email address to access all features.</p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form" style={{ textAlign: "center", padding: "60px 40px" }}>
          {status === "loading" && (
            <div>
              <Loader2 size={48} className="spin" style={{ margin: "0 auto 24px", color: "var(--accent)" }} />
              <h2 className="auth-title">Verifying your email...</h2>
              <p className="auth-subtitle">Please wait a moment.</p>
            </div>
          )}

          {status === "success" && (
            <div>
              <CheckCircle size={48} style={{ margin: "0 auto 24px", color: "#16a34a" }} />
              <h2 className="auth-title" style={{ color: "#16a34a" }}>Verified!</h2>
              <p className="auth-subtitle">{message}</p>
              <p className="auth-subtitle" style={{ marginTop: "16px", fontSize: "13px", color: "var(--muted)" }}>Redirecting to login...</p>
              <Link href="/auth/login" className="btn btn-primary" style={{ marginTop: "24px", display: "inline-block" }}>Go to Login</Link>
            </div>
          )}

          {status === "error" && (
            <div>
              <XCircle size={48} style={{ margin: "0 auto 24px", color: "#ef4444" }} />
              <h2 className="auth-title" style={{ color: "#ef4444" }}>Verification Failed</h2>
              <p className="auth-subtitle">{message}</p>
              <Link href="/auth/login" className="btn btn-primary" style={{ marginTop: "24px", display: "inline-block" }}>Go to Login</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="auth-page">
        <div className="auth-form" style={{ textAlign: "center", padding: "60px 40px" }}>
          <Loader2 size={48} className="spin" style={{ margin: "0 auto 24px", color: "var(--accent)" }} />
          <p>Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
