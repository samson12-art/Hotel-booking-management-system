"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { Hotel, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success("Login successful!");
      const { user } = useAuthStore.getState();
      if (user) {
        switch (user.role) {
          case "ADMIN": router.push("/admin/dashboard"); break;
          case "HOTEL_MANAGER": router.push("/manager/dashboard"); break;
          default: router.push("/dashboard");
        }
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Login failed. Please try again.";
      toast.error(message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div>
          <Hotel size={64} style={{ margin: "0 auto 24px" }} />
          <h1>Welcome Back</h1>
          <p>Sign in to book your stay at XY Hotel.</p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form">
          <div className="auth-brand" style={{ display: "none" }}>
            <Hotel size={32} />
            <span>XY Hotel</span>
          </div>

          <h2 className="auth-title">Sign In</h2>
          <p className="auth-subtitle">Enter your credentials to access your account</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="form-input-icon">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="form-input" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "var(--muted)", cursor: "pointer" }}>
                <input type="checkbox" style={{ borderRadius: "4px" }} />Remember me
              </label>
              <Link href="/auth/forgot-password" style={{ fontSize: "14px", color: "var(--accent)", fontWeight: 500 }}>Forgot password?</Link>
            </div>
            <button type="submit" disabled={isLoading} className="btn btn-primary w-full btn-lg">
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="auth-footer">
            Don&apos;t have an account? <Link href="/auth/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
