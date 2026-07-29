"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";
import { Shield, Upload, CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import { getFileUrl } from "@/lib/utils";

export default function VerifyIdPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const { data } = await api.get("/id-verification/status");
      setStatus(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("idDocument", file);
      await api.post("/id-verification/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("ID document uploaded. Pending verification.");
      setFile(null);
      fetchStatus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const getStatusDisplay = () => {
    if (!status || status.status === "NONE") {
      return { icon: <Shield size={48} />, color: "var(--muted)", label: "Not Submitted", description: "Upload your government-issued ID to verify your account." };
    }
    if (status.status === "PENDING") {
      return { icon: <Clock size={48} />, color: "#f59e0b", label: "Pending Review", description: "Your ID document is being reviewed by our team." };
    }
    if (status.status === "VERIFIED") {
      return { icon: <CheckCircle size={48} />, color: "#16a34a", label: "Verified", description: "Your identity has been verified. Your account is fully verified." };
    }
    if (status.status === "REJECTED") {
      return { icon: <XCircle size={48} />, color: "#ef4444", label: "Rejected", description: status.note || "Your ID was rejected. Please upload a new document." };
    }
    return { icon: <Shield size={48} />, color: "var(--muted)", label: "Unknown", description: "" };
  };

  if (loading) {
    return (
      <AppShell>
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
          <p className="color-muted">Loading...</p>
        </div>
      </AppShell>
    );
  }

  const statusDisplay = getStatusDisplay();
  const canUpload = !status || status.status === "NONE" || status.status === "REJECTED";

  return (
    <AppShell>
      <div className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Identity Verification</h1>
        </div>
      </div>

      <div style={{ maxWidth: "600px" }}>
        {/* Status Card */}
        <div className="card mb-6">
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
            <div style={{ color: statusDisplay.color }}>{statusDisplay.icon}</div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 700 }}>{statusDisplay.label}</h2>
              <p className="color-muted" style={{ fontSize: "14px" }}>{statusDisplay.description}</p>
            </div>
          </div>

          {status?.documentUrl && (
            <div style={{ marginTop: "12px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>Uploaded Document:</p>
              <a
                href={getFileUrl(status.documentUrl)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--accent)", fontSize: "14px", fontWeight: 500 }}
              >
                <FileText size={16} />
                View Document
              </a>
            </div>
          )}
        </div>

        {/* Upload Form */}
        {canUpload && (
          <div className="card">
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Upload ID Document</h3>
            <p className="color-muted" style={{ fontSize: "14px", marginBottom: "16px" }}>
              Please upload a clear photo or scan of your government-issued ID (passport, national ID, or driver&apos;s license).
            </p>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label className="form-label">Select File</label>
                <div
                  style={{
                    border: "2px dashed var(--border)",
                    borderRadius: "var(--radius)",
                    padding: "32px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: file ? "var(--accent-light)" : "var(--bg)",
                  }}
                  onClick={() => document.getElementById("id-file-input")?.click()}
                >
                  <Upload size={32} style={{ margin: "0 auto 8px", color: "var(--muted)" }} />
                  {file ? (
                    <p style={{ fontWeight: 600 }}>{file.name}</p>
                  ) : (
                    <>
                      <p style={{ fontWeight: 600 }}>Click to select file</p>
                      <p className="color-muted" style={{ fontSize: "13px" }}>JPG, PNG, or PDF (max 10MB)</p>
                    </>
                  )}
                  <input
                    id="id-file-input"
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              <button type="submit" disabled={uploading || !file} className="btn btn-primary w-full">
                {uploading ? "Uploading..." : "Upload Document"}
              </button>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}
