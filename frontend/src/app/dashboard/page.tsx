"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import AppShell from "@/components/AppShell";
import BookingStatusBadge from "@/components/BookingStatusBadge";
import BookingQRCode from "@/components/BookingQRCode";
import LoadingSpinner from "@/components/LoadingSpinner";
import LoyaltyCard from "@/components/LoyaltyCard";
import Recommendations from "@/components/Recommendations";
import { useAuthStore } from "@/store/authStore";
import { Calendar, CreditCard, Heart, Star, Clock, AlertTriangle, QrCode } from "lucide-react";
import toast from "react-hot-toast";

export default function CustomerDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState<Record<string, boolean>>({});
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const user = useAuthStore((s) => s.user);

  const downloadInvoice = async (booking: any, format: "pdf" | "excel") => {
    setDownloading((prev) => ({ ...prev, [booking.id]: true }));
    try {
      const res = await api.get(`/bookings/${booking.id}/invoice?format=${format}`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${booking.bookingNumber || booking.id}.${format === "excel" ? "xlsx" : "pdf"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      let msg = "Failed to download invoice";
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          msg = json.message || msg;
        } catch {}
      } else if (err.response?.data) {
        msg = err.response.data.message || err.response.data.error || msg;
      } else {
        msg = err.message || msg;
      }
      console.error("[Invoice]", msg, err);
      toast.error(msg);
    } finally {
      setDownloading((prev) => ({ ...prev, [booking.id]: false }));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: res } = await api.get("/dashboard/customer");
        setData(res.data);
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <AppShell><div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}><LoadingSpinner size="lg" /></div></AppShell>;

  return (
    <AppShell>
      <div className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">My Dashboard</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card stat-card-horizontal">
          <div className="stat-card-icon blue"><Calendar size={20} /></div>
          <div>
            <div className="stat-card-label">Upcoming</div>
            <div className="stat-card-value">{data?.upcomingBookings?.length || 0}</div>
          </div>
        </div>
        <div className="stat-card stat-card-horizontal">
          <div className="stat-card-icon green"><CreditCard size={20} /></div>
          <div>
            <div className="stat-card-label">Total Spent</div>
            <div className="stat-card-value">${(data?.totalSpent || 0).toFixed(2)}</div>
          </div>
        </div>
        <div className="stat-card stat-card-horizontal">
          <div className="stat-card-icon red"><Heart size={20} /></div>
          <div>
            <div className="stat-card-label">Saved</div>
            <div className="stat-card-value">{data?.savedHotels?.length || 0}</div>
          </div>
        </div>
      </div>

      {/* Email Verification Banner */}
      {user && !(user as any).isVerified && (
        <div className="alert alert-warning" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "8px", background: "#fef3c7", border: "1px solid #fbbf24", marginBottom: "16px" }}>
          <AlertTriangle size={20} style={{ color: "#d97706", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong style={{ color: "#92400e" }}>Email not verified</strong>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#92400e" }}>Please check your inbox and verify your email to access all features.</p>
          </div>
          <button onClick={async () => {
            try {
              await api.post("/auth/resend-verification");
              toast.success("Verification email resent!");
            } catch { toast.error("Failed to resend."); }
          }} className="btn btn-sm" style={{ background: "#d97706", color: "#fff", whiteSpace: "nowrap", border: "none", cursor: "pointer", fontSize: "13px" }}>Resend</button>
        </div>
      )}

      {/* Loyalty */}
      <LoyaltyCard />

      <div style={{ height: "16px" }} />

      {/* Recommendations */}
      <Recommendations />

      <div style={{ height: "16px" }} />

      {/* Upcoming Bookings */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title">Upcoming Bookings</h2>
          <Link href="/hotels" className="btn btn-secondary btn-sm">Book a Room</Link>
        </div>
        {data?.upcomingBookings?.length === 0 ? (
          <div className="empty-state">
            <p>No upcoming bookings. <Link href="/hotels" style={{ color: "var(--accent)", fontWeight: 600 }}>Browse rooms</Link></p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {data?.upcomingBookings?.map((booking: any) => (
              <div key={booking.id} className="booking-card">
                <div className="booking-card-info">
                  <h3>{booking.hotel?.name}</h3>
                  <p>{booking.hotel?.address}</p>
                  <p><Clock size={12} style={{ display: "inline", marginRight: "4px" }} />{new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}</p>
                  {showQr[booking.id] && (
                    <div style={{ marginTop: "12px" }}>
                      <BookingQRCode bookingNumber={booking.bookingNumber} status={booking.status} hotelName={booking.hotel?.name} checkIn={booking.checkIn} checkOut={booking.checkOut} guests={booking.guests} totalAmount={booking.totalAmount} />
                    </div>
                  )}
                </div>
                <div className="booking-card-right">
                  <BookingStatusBadge status={booking.status} />
                  <div className="amount">${booking.totalAmount.toFixed(2)}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px" }}>
                    <button onClick={() => setShowQr((prev) => ({ ...prev, [booking.id]: !prev[booking.id] }))}
                      className="btn btn-sm btn-secondary" style={{ fontSize: "12px", padding: "4px 10px", cursor: "pointer" }}>
                      <QrCode size={12} style={{ marginRight: "4px", display: "inline" }} /> {showQr[booking.id] ? "Hide QR" : "Show QR"}
                    </button>
                    {["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"].includes(booking.status) && (
                      <select onChange={(e) => { const f = e.target.value; if (f) downloadInvoice(booking, f as "pdf" | "excel"); e.target.value = ""; }}
                        className="btn btn-sm btn-secondary" style={{ fontSize: "12px", padding: "4px 10px", cursor: "pointer", border: "none", appearance: "auto" }}
                        disabled={downloading[booking.id]} value="">
                        <option value="" disabled>{downloading[booking.id] ? "Downloading..." : "Download"}</option>
                        <option value="pdf">PDF</option>
                        <option value="excel">Excel</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
        }
      </div>

      {/* Past Bookings */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title">Past Bookings</h2>
        </div>
        {data?.pastBookings?.length === 0 ? (
          <div className="empty-state"><p>No past bookings</p></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {data?.pastBookings?.map((booking: any) => (
              <div key={booking.id} className="booking-card">
                <div className="booking-card-info">
                  <h3>{booking.hotel?.name}</h3>
                  <p>{new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}</p>
                </div>
                <div className="booking-card-right">
                  <BookingStatusBadge status={booking.status} />
                  <div className="amount">${booking.totalAmount.toFixed(2)}</div>
                  {["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"].includes(booking.status) && (
                    <select onChange={(e) => { const f = e.target.value; if (f) downloadInvoice(booking, f as "pdf" | "excel"); e.target.value = ""; }}
                      className="btn btn-sm btn-secondary" style={{ fontSize: "12px", padding: "4px 10px", cursor: "pointer", border: "none", appearance: "auto", marginTop: "8px" }}
                      disabled={downloading[booking.id]} value="">
                      <option value="" disabled>{downloading[booking.id] ? "Downloading..." : "Download"}</option>
                      <option value="pdf">PDF</option>
                      <option value="excel">Excel</option>
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Reviews */}
      {data?.recentReviews?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">My Reviews</h2>
          </div>
          <div>
            {data.recentReviews.map((review: any) => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <div className="review-stars">
                    {Array.from({ length: review.rating }).map((_, i) => <Star key={i} size={14} style={{ fill: "#fbbf24", color: "#fbbf24" }} />)}
                  </div>
                  <span className="text-sm color-muted">at {review.hotel?.name}</span>
                </div>
                <p className="review-text">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
