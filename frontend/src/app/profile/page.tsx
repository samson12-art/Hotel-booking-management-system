"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import AppShell from "@/components/AppShell";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { User, Camera, Shield, CheckCircle, XCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, loadUser } = useAuthStore();
  const [formData, setFormData] = useState({ firstName: "", lastName: "", phone: "" });
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);

  useEffect(() => {
    if (user) setFormData({ firstName: user.firstName, lastName: user.lastName, phone: (user as any).phone || "" });
    fetchVerificationStatus();
  }, [user]);

  const fetchVerificationStatus = async () => {
    try {
      const { data } = await api.get("/id-verification/status");
      setVerificationStatus(data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put("/users/profile", formData);
      toast.success("Profile updated");
      loadUser();
    } catch (error: any) { toast.error(error.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) { toast.error("Passwords don't match"); return; }
    setLoading(true);
    try {
      await api.put("/users/password", { currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
      toast.success("Password updated");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) { toast.error(error.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <AppShell>
      <div className="topbar"><div className="topbar-left"><h1 className="topbar-title">My Profile</h1></div></div>

      <div style={{ maxWidth: "700px" }}>
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <div style={{ position: "relative" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={40} style={{ color: "var(--accent)" }} />
              </div>
              <label style={{ position: "absolute", bottom: 0, right: 0, padding: "6px", background: "var(--accent)", color: "#fff", borderRadius: "50%", cursor: "pointer" }}>
                <Camera size={14} />
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  if (!e.target.files?.[0]) return;
                  const fd = new FormData();
                  fd.append("profile", e.target.files[0]);
                  try { await api.post("/users/profile-picture", fd); toast.success("Photo updated"); loadUser(); } catch (err) { toast.error("Upload failed"); }
                }} />
              </label>
            </div>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 700 }}>{user?.firstName} {user?.lastName}</h2>
              <p className="color-muted">{user?.email}</p>
              <span className="badge badge-teal" style={{ marginTop: "4px" }}>{user?.role?.replace(/_/g, " ")}</span>
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Personal Information</h3>
          <form onSubmit={handleProfileUpdate}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="form-input" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="form-input" />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary">{loading ? "Saving..." : "Save Changes"}</button>
          </form>
        </div>

        {/* Verification Status */}
        <div className="card mb-6">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Shield size={24} style={{ color: verificationStatus?.status === "VERIFIED" ? "#16a34a" : verificationStatus?.status === "PENDING" ? "#f59e0b" : "var(--muted)" }} />
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Identity Verification</h3>
                <p className="color-muted" style={{ fontSize: "13px" }}>
                  {verificationStatus?.status === "VERIFIED" && "Your identity has been verified."}
                  {verificationStatus?.status === "PENDING" && "Your ID is being reviewed."}
                  {verificationStatus?.status === "REJECTED" && "Your ID was rejected. Please re-upload."}
                  {(!verificationStatus || verificationStatus?.status === "NONE") && "Verify your identity to fully activate your account."}
                </p>
              </div>
            </div>
            <Link href="/profile/verify" className="btn btn-secondary btn-sm">
              {verificationStatus?.status === "PENDING" ? "View Status" : verificationStatus?.status === "VERIFIED" ? "View Details" : "Verify Now"}
            </Link>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Change Password</h3>
          <form onSubmit={handlePasswordUpdate}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} className="form-input" required minLength={8} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className="form-input" required />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary">{loading ? "Updating..." : "Update Password"}</button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
