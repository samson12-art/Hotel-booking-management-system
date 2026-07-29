"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { Hotel, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "", phone: "" });
  const [showPassword, setShowPassword] = useState(false);
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }
    try {
      await register({ firstName: formData.firstName, lastName: formData.lastName, email: formData.email, password: formData.password, phone: formData.phone || undefined });
      toast.success("Registration successful! Please check your email to verify your account.");
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
      toast.error(error.response?.data?.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div>
          <Hotel size={64} style={{ margin: "0 auto 24px" }} />
          <h1>Join XY Hotel</h1>
          <p>Create an account and book your perfect room at XY Hotel.</p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form">
          <div className="auth-brand" style={{ display: "none" }}>
            <Hotel size={32} />
            <span>XY Hotel</span>
          </div>

          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Fill in your details to get started</p>

          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="form-input" required minLength={2} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="form-input" required minLength={2} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone (Optional)</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="form-input" placeholder="+251 9XX XXX XXX" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="form-input-icon">
                <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className="form-input" placeholder="••••••••" required minLength={8} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formData.password && (
                <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--muted)" }}>
                  {["Min 8 characters", "One uppercase", "One lowercase", "One number"].map((rule) => {
                    const met =
                      (rule === "Min 8 characters" && formData.password.length >= 8) ||
                      (rule === "One uppercase" && /[A-Z]/.test(formData.password)) ||
                      (rule === "One lowercase" && /[a-z]/.test(formData.password)) ||
                      (rule === "One number" && /[0-9]/.test(formData.password));
                    return (
                      <span key={rule} style={{ display: "inline-block", marginRight: "8px", color: met ? "#16a34a" : "var(--muted)" }}>
                        {met ? "✓" : "○"} {rule}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="form-input" placeholder="••••••••" required />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p style={{ marginTop: "4px", fontSize: "12px", color: "#ef4444" }}>Passwords don&apos;t match</p>
              )}
            </div>
            <button type="submit" disabled={isLoading} className="btn btn-primary w-full btn-lg">
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link href="/auth/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
