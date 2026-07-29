"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import AppShell from "@/components/AppShell";
import LoadingSpinner from "@/components/LoadingSpinner";
import BookingStatusBadge from "@/components/BookingStatusBadge";
import { Hotel, Bed, Clock, DollarSign } from "lucide-react";

export default function ManagerDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: res } = await api.get("/dashboard/manager");
        setData(res.data);
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <AppShell><div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}><LoadingSpinner size="lg" /></div></AppShell>;

  const stats = [
    { label: "My Hotels", value: data?.myHotels?.length || 0, icon: Hotel, color: "blue" },
    { label: "Total Rooms", value: data?.totalRooms || 0, icon: Bed, color: "purple" },
    { label: "Pending Bookings", value: data?.pendingBookings || 0, icon: Clock, color: "yellow" },
    { label: "Total Revenue", value: `$${(data?.totalRevenue || 0).toFixed(0)}`, icon: DollarSign, color: "green" },
  ];

  return (
    <AppShell>
      <div className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Manager Dashboard</h1>
        </div>
      </div>

      <div className="stat-grid">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card stat-card-horizontal">
            <div className={`stat-card-icon ${stat.color}`}><stat.icon size={20} /></div>
            <div>
              <div className="stat-card-label">{stat.label}</div>
              <div className="stat-card-value">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card mb-6">
        <div className="card-header"><h2 className="card-title">Room Status Overview</h2></div>
        <div className="grid-5">
          {data?.roomStatusBreakdown?.map((s: any) => (
            <div key={s.status} style={{ padding: "16px", background: "var(--bg)", borderRadius: "var(--radius)", textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: 800 }}>{s.count}</div>
              <div className="text-sm color-muted">{s.status.replace(/_/g, " ")}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card mb-6">
        <div className="card-header"><h2 className="card-title">My Hotels</h2></div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {data?.myHotels?.map((hotel: any) => (
            <div key={hotel.id} className="flex items-center justify-between" style={{ padding: "16px", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{hotel.name}</div>
                <div className="text-sm color-muted">{hotel._count?.rooms} rooms | {hotel._count?.bookings} bookings | {hotel._count?.reviews} reviews</div>
              </div>
              <span className={`badge ${hotel.isActive ? "badge-green" : "badge-red"}`}>{hotel.isActive ? "Active" : "Inactive"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h2 className="card-title">Recent Bookings</h2></div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Room(s)</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentBookings?.map((b: any) => (
                <tr key={b.id}>
                  <td>{b.user?.firstName} {b.user?.lastName}</td>
                  <td>{b.bookingDetails?.map((d: any) => d.room?.roomNumber).join(", ")}</td>
                  <td>{new Date(b.checkIn).toLocaleDateString()} - {new Date(b.checkOut).toLocaleDateString()}</td>
                  <td><BookingStatusBadge status={b.status} /></td>
                  <td style={{ fontWeight: 700, color: "var(--success)" }}>${b.totalAmount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!data?.recentBookings || data.recentBookings.length === 0) && <div className="empty-state"><p>No bookings yet</p></div>}
        </div>
      </div>
    </AppShell>
  );
}
