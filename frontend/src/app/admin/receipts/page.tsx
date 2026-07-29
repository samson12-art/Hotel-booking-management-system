"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import AppShell from "@/components/AppShell";
import Pagination from "@/components/Pagination";
import LoadingSpinner from "@/components/LoadingSpinner";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, Eye, ExternalLink } from "lucide-react";
import { getFileUrl } from "@/lib/utils";

export default function AdminReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [reviewModal, setReviewModal] = useState<any>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (statusFilter) params.set("status", statusFilter);
      const { data } = await api.get(`/receipts?${params.toString()}`);
      setReceipts(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReceipts(); }, [page, statusFilter]);

  const handleReview = async (receiptId: string, status: "VERIFIED" | "REJECTED") => {
    setReviewing(true);
    try {
      await api.put(`/receipts/${receiptId}/review`, { status, note: reviewNote || undefined });
      toast.success(`Receipt ${status === "VERIFIED" ? "verified" : "rejected"}`);
      setReviewModal(null);
      setReviewNote("");
      fetchReceipts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed");
    } finally {
      setReviewing(false);
    }
  };

  const statusBadge = (s: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      PENDING: { bg: "#fef3c7", color: "#92400e" },
      VERIFIED: { bg: "#d1fae5", color: "#065f46" },
      REJECTED: { bg: "#fee2e2", color: "#991b1b" },
    };
    const style = styles[s] || { bg: "var(--bg)", color: "var(--muted)" };
    return (
      <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, background: style.bg, color: style.color }}>
        {s}
      </span>
    );
  };

  return (
    <AppShell>
      <div className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Receipt Verifications</h1>
        </div>
      </div>

      <div className="flex gap-4 mb-6" style={{ flexWrap: "wrap" }}>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="form-input"
          style={{ width: "auto", minWidth: "150px" }}
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="VERIFIED">Verified</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Booking</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Note</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r: any) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.user?.firstName} {r.user?.lastName}</td>
                  <td>{r.booking?.bookingNumber || "—"}</td>
                  <td style={{ fontWeight: 700 }}>${r.amount.toFixed(2)}</td>
                  <td>{r.paymentMethod.replace(/_/g, " ")}</td>
                  <td>{statusBadge(r.status)}</td>
                  <td className="color-muted" style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.note || "—"}
                  </td>
                  <td className="color-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {r.fileUrl && (
                        <a href={getFileUrl(r.fileUrl)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-icon btn-sm" title="View Receipt">
                          <ExternalLink size={14} />
                        </a>
                      )}
                      {r.status === "PENDING" && (
                        <button onClick={() => setReviewModal(r)} className="btn btn-primary btn-icon btn-sm" title="Review">
                          <Eye size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {receipts.length === 0 && <div className="empty-state"><p>No receipts found</p></div>}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Review Modal */}
      {reviewModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setReviewModal(null)}
        >
          <div
            className="card"
            style={{ width: "90%", maxWidth: "500px", padding: "24px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>Review Receipt</h3>

            <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div><span className="color-muted">User:</span> <strong>{reviewModal.user?.firstName} {reviewModal.user?.lastName}</strong></div>
              <div><span className="color-muted">Booking:</span> <strong>{reviewModal.booking?.bookingNumber || "—"}</strong></div>
              <div><span className="color-muted">Amount:</span> <strong>${reviewModal.amount.toFixed(2)}</strong></div>
              <div><span className="color-muted">Method:</span> <strong>{reviewModal.paymentMethod.replace(/_/g, " ")}</strong></div>
            </div>

            {reviewModal.fileUrl && (
              <div style={{ marginBottom: "16px" }}>
                <a href={getFileUrl(reviewModal.fileUrl)} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--accent)", fontWeight: 500 }}>
                  <ExternalLink size={16} /> View Receipt File
                </a>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Note (optional)</label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="form-input"
                rows={3}
                placeholder="Add a note for the user..."
              />
            </div>

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button onClick={() => setReviewModal(null)} className="btn btn-secondary">Cancel</button>
              <button
                onClick={() => handleReview(reviewModal.id, "REJECTED")}
                disabled={reviewing}
                className="btn btn-danger"
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <XCircle size={16} /> Reject
              </button>
              <button
                onClick={() => handleReview(reviewModal.id, "VERIFIED")}
                disabled={reviewing}
                className="btn btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <CheckCircle size={16} /> Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
