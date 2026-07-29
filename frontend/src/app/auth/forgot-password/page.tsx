"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Hotel, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setIsSubmitted(true);
      toast.success("If the email exists, a reset link has been sent.");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div>
          <Hotel size={64} style={{ margin: "0 auto 24px" }} />
          <h1>XY Hotel</h1>
          <p>We&apos;ll help you get back into your account.</p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form">
          {isSubmitted ? (
            <div className="text-center">
              <CheckCircle size={64} style={{ color: "var(--success)", margin: "0 auto 16px" }} />
              <h2 className="auth-title">Check Your Email</h2>
              <p className="auth-subtitle">We&apos;ve sent a password reset link to your email address.</p>
              <Link href="/auth/login" className="btn btn-primary w-full btn-lg" style={{ marginTop: "24px" }}>Back to Login</Link>
            </div>
          ) : (
            <>
              <h2 className="auth-title">Forgot Password?</h2>
              <p className="auth-subtitle">Enter your email and we&apos;ll send you a reset link.</p>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" placeholder="you@example.com" required />
                </div>
                <button type="submit" disabled={loading} className="btn btn-primary w-full btn-lg">
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            </>
          )}
          <Link href="/auth/login" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "24px", fontSize: "14px", color: "var(--muted)" }}>
            <ArrowLeft size={16} /> Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
