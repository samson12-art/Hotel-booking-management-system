"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import AppShell from "@/components/AppShell";
import LoadingSpinner from "@/components/LoadingSpinner";
import BookingStatusBadge from "@/components/BookingStatusBadge";
import { Hotel, Bed, CalendarCheck, Users, DollarSign, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: res } = await api.get("/dashboard/admin");
        setData(res.data);
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <AppShell><div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}><LoadingSpinner size="lg" /></div></AppShell>;

  const stats = [
    { label: "Total Hotels", value: data?.totalHotels || 0, icon: Hotel, color: "blue" },
    { label: "Total Rooms", value: data?.totalRooms || 0, icon: Bed, color: "purple" },
    { label: "Active Bookings", value: data?.activeBookings || 0, icon: CalendarCheck, color: "green" },
    { label: "Total Customers", value: data?.totalCustomers || 0, icon: Users, color: "orange" },
    { label: "Monthly Revenue", value: `$${(data?.monthlyRevenue || 0).toFixed(0)}`, icon: DollarSign, color: "teal" },
    { label: "Occupancy Rate", value: `${data?.occupancyRate || 0}%`, icon: TrendingUp, color: "cyan" },
  ];

  return (
    <AppShell>
      <div className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Admin Dashboard</h1>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {stats.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className={`stat-card-icon ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div className="stat-card-value">{stat.value}</div>
            <div className="stat-card-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Revenue Growth */}
        <div className="card">
          <div className="card-header"><h2 className="card-title">Revenue Overview</h2></div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="flex items-center justify-between">
              <span className="color-muted">This Month</span>
              <span style={{ fontWeight: 800, fontSize: "18px" }}>${(data?.monthlyRevenue || 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="color-muted">Last Month</span>
              <span style={{ fontWeight: 700 }}>${(data?.lastMonthRevenue || 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="color-muted">Growth</span>
              <span style={{ fontWeight: 700, color: data?.revenueGrowth >= 0 ? "var(--success)" : "var(--danger)" }}>
                {data?.revenueGrowth || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Room Status */}
        <div className="card">
          <div className="card-header"><h2 className="card-title">Room Status</h2></div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {data?.roomStatusBreakdown?.map((status: any) => (
              <div key={status.status} className="flex items-center justify-between">
                <span className="color-muted">{status.status.replace(/_/g, " ")}</span>
                <div className="flex items-center gap-2" style={{ flex: 1, maxWidth: "160px" }}>
                  <div className="progress-bar" style={{ flex: 1 }}>
                    <div className="progress-bar-fill" style={{ width: `${(status.count / (data?.totalRooms || 1)) * 100}%` }} />
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 600, minWidth: "32px", textAlign: "right" }}>{status.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Status */}
        <div className="card">
          <div className="card-header"><h2 className="card-title">Booking Status</h2></div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {data?.bookingStatusBreakdown?.map((status: any) => (
              <div key={status.status} className="flex items-center justify-between" style={{ padding: "8px 12px", background: "var(--bg)", borderRadius: "var(--radius)" }}>
                <BookingStatusBadge status={status.status} />
                <span style={{ fontWeight: 600 }}>{status.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="card">
          <div className="card-header"><h2 className="card-title">Payment Methods</h2></div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {data?.paymentMethodBreakdown?.map((method: any) => (
              <div key={method.method} className="flex items-center justify-between">
                <span className="color-muted">{method.method.replace(/_/g, " ")}</span>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontWeight: 600 }}>{method.count}</span>
                  <span className="text-sm color-muted" style={{ marginLeft: "8px" }}>${(method.totalAmount || 0).toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Booked Hotels */}
        <div className="card" style={{ gridColumn: "span 2" }}>
          <div className="card-header"><h2 className="card-title">Most Booked Hotels</h2></div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {data?.mostBookedHotels?.map((hotel: any, i: number) => (
              <div key={hotel.id} className="flex items-center justify-between" style={{ padding: "12px", background: "var(--bg)", borderRadius: "var(--radius)" }}>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: "18px", fontWeight: 800, color: "var(--muted)" }}>#{i + 1}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{hotel.name}</div>
                    <div className="text-sm color-muted">{hotel._count?.rooms} rooms</div>
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: "var(--accent)" }}>{hotel.bookingCount} bookings</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="card" style={{ gridColumn: "span 2" }}>
          <div className="card-header"><h2 className="card-title">Recent Bookings</h2></div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Hotel</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentBookings?.map((booking: any) => (
                  <tr key={booking.id}>
                    <td>{booking.user?.firstName} {booking.user?.lastName}</td>
                    <td>{booking.hotel?.name}</td>
                    <td><BookingStatusBadge status={booking.status} /></td>
                    <td style={{ fontWeight: 700 }}>${booking.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
