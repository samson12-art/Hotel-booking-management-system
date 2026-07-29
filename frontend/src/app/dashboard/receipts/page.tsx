"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import AppShell from "@/components/AppShell";
import Pagination from "@/components/Pagination";
import LoadingSpinner from "@/components/LoadingSpinner";
import toast from "react-hot-toast";
import { Upload, FileText, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

export default function MyReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({ bookingId: "", amount: "", paymentMethod: "CASH" });

  useEffect(() => {
    fetchReceipts();
    fetchBookings();
  }, [page]);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/receipts/my?page=${page}&limit=10`);
      setReceipts(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    setBookingsLoading(true);
    try {
      const { data } = await api.get("/bookings/my?limit=50");
      setBookings(data.data || []);
    } catch (error: any) {
      console.error("Failed to load bookings:", error);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error("Please select a file"); return; }
    if (!formData.bookingId) { toast.error("Please select a booking"); return; }
    if (!formData.amount) { toast.error("Please enter the amount"); return; }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("receipt", file);
      fd.append("bookingId", formData.bookingId);
      fd.append("amount", formData.amount);
      fd.append("paymentMethod", formData.paymentMethod);
      await api.post("/receipts/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Receipt uploaded. Pending verification.");
      setShowUpload(false);
      setFile(null);
      setFormData({ bookingId: "", amount: "", paymentMethod: "CASH" });
      fetchReceipts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const selectedBooking = bookings.find((b) => b.id === formData.bookingId);

  const statusIcon = (s: string) => {
    if (s === "PENDING") return <Clock size={14} style={{ color: "#f59e0b" }} />;
    if (s === "VERIFIED") return <CheckCircle size={14} style={{ color: "#16a34a" }} />;
    if (s === "REJECTED") return <XCircle size={14} style={{ color: "#ef4444" }} />;
    return null;
  };

  return (
    <AppShell>
      <div className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">My Receipts</h1>
        </div>
        <button onClick={() => setShowUpload(!showUpload)} className="btn btn-primary btn-sm" disabled={bookings.length === 0 && !bookingsLoading}>
          <Upload size={16} /> Upload Receipt
        </button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="card mb-6">
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Upload Payment Receipt</h3>
          <form onSubmit={handleUpload}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Booking</label>
                <select
                  value={formData.bookingId}
                  onChange={(e) => {
                    const bId = e.target.value;
                    const b = bookings.find((x) => x.id === bId);
                    setFormData({
                      ...formData,
                      bookingId: bId,
                      amount: b ? String(b.totalAmount) : formData.amount,
                    });
                  }}
                  className="form-input"
                  required
                >
                  <option value="">Select booking</option>
                  {bookings.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.bookingNumber} - ${b.totalAmount?.toFixed(2)} ({b.status})
                    </option>
                  ))}
                </select>
                {bookings.length === 0 && !bookingsLoading && (
                  <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>
                    No bookings found. <Link href="/hotels" style={{ fontWeight: 600 }}>Book a room first</Link>
                  </p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="form-input"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            {selectedBooking && (
              <div style={{ padding: "12px", background: "var(--bg)", borderRadius: "var(--radius)", marginBottom: "16px", fontSize: "14px" }}>
                <strong>{selectedBooking.hotel?.name || "Hotel"}</strong>
                <span className="color-muted" style={{ marginLeft: "8px" }}>
                  {new Date(selectedBooking.checkIn).toLocaleDateString()} - {new Date(selectedBooking.checkOut).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="form-input"
              >
                <option value="CASH">Cash</option>
                <option value="TELEBIRR">TeleBirr</option>
                <option value="CBE_BIRR">CBE Birr</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="PAYPAL">PayPal</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Receipt File</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="form-input"
                required
              />
              {file && <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>{file.name}</p>}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="submit" disabled={uploading || !formData.bookingId} className="btn btn-primary">
                {uploading ? "Uploading..." : "Submit Receipt"}
              </button>
              <button type="button" onClick={() => setShowUpload(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* No Bookings Warning */}
      {!bookingsLoading && bookings.length === 0 && (
        <div className="card mb-6">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px" }}>
            <AlertCircle size={20} style={{ color: "#f59e0b", flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 600 }}>No bookings found</p>
              <p className="color-muted" style={{ fontSize: "14px" }}>
                You need to have a booking before uploading a receipt.{" "}
                <Link href="/hotels" style={{ color: "var(--accent)", fontWeight: 600 }}>Browse rooms</Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Receipts List */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}><LoadingSpinner size="lg" /></div>
      ) : receipts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <FileText size={48} style={{ margin: "0 auto 12px", color: "var(--muted)" }} />
            <p>No receipts uploaded yet</p>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Booking</th>
                <th>Hotel</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Note</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r: any) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.booking?.bookingNumber || "—"}</td>
                  <td>{r.booking?.hotel?.name || "—"}</td>
                  <td style={{ fontWeight: 700 }}>${r.amount.toFixed(2)}</td>
                  <td>{r.paymentMethod.replace(/_/g, " ")}</td>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      {statusIcon(r.status)}
                      {r.status}
                    </span>
                  </td>
                  <td className="color-muted" style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.note || "—"}
                  </td>
                  <td className="color-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </AppShell>
  );
}
