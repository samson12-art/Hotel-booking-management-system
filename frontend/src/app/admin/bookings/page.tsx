"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import AppShell from "@/components/AppShell";
import BookingStatusBadge from "@/components/BookingStatusBadge";
import Pagination from "@/components/Pagination";
import toast from "react-hot-toast";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (statusFilter) params.set("status", statusFilter);
      const { data } = await api.get(`/bookings?${params.toString()}`);
      setBookings(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, [page, statusFilter]);

  const handleAction = async (bookingId: string, action: string) => {
    try {
      await api.put(`/bookings/${bookingId}/${action}`);
      toast.success(`Booking ${action}d successfully`);
      fetchBookings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Action failed");
    }
  };

  return (
    <AppShell>
      <div className="topbar">
        <div className="topbar-left"><h1 className="topbar-title">Manage Bookings</h1></div>
        <div className="topbar-right">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="form-input" style={{ width: "auto" }}>
            <option value="">All Status</option>
            {["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"].map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Booking #</th>
              <th>Guest</th>
              <th>Hotel</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b: any) => (
              <tr key={b.id}>
                <td style={{ fontWeight: 600, fontSize: "13px" }}>{b.bookingNumber}</td>
                <td>{b.user?.firstName} {b.user?.lastName}</td>
                <td>{b.hotel?.name}</td>
                <td>{new Date(b.checkIn).toLocaleDateString()}</td>
                <td>{new Date(b.checkOut).toLocaleDateString()}</td>
                <td><BookingStatusBadge status={b.status} /></td>
                <td style={{ fontWeight: 700 }}>${b.totalAmount.toFixed(2)}</td>
                <td>
                  <div className="flex gap-2">
                    {b.status === "PENDING" && (
                      <>
                        <button onClick={() => handleAction(b.id, "confirm")} className="btn btn-primary btn-sm">Confirm</button>
                        <button onClick={() => handleAction(b.id, "reject")} className="btn btn-danger btn-sm">Reject</button>
                      </>
                    )}
                    {b.status === "CONFIRMED" && <button onClick={() => handleAction(b.id, "check-in")} className="btn btn-primary btn-sm">Check In</button>}
                    {b.status === "CHECKED_IN" && <button onClick={() => handleAction(b.id, "check-out")} className="btn btn-primary btn-sm">Check Out</button>}
                    {!["CHECKED_OUT", "CANCELLED"].includes(b.status) && <button onClick={() => handleAction(b.id, "cancel")} className="btn btn-danger btn-sm">Cancel</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bookings.length === 0 && !loading && <div className="empty-state"><p>No bookings found</p></div>}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </AppShell>
  );
}
