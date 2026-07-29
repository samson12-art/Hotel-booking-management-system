"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import AppShell from "@/components/AppShell";
import LoadingSpinner from "@/components/LoadingSpinner";
import { FileText, DollarSign, Bed, Users, XCircle, Download, FileSpreadsheet } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminReportsPage() {
  const [activeReport, setActiveReport] = useState("booking");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const endpoints: Record<string, string> = { booking: "bookings", revenue: "revenue", occupancy: "occupancy", customer: "customers", cancellation: "cancellations" };
      const { data: res } = await api.get(`/reports/${endpoints[activeReport]}?${params.toString()}`);
      setData(res.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, [activeReport, startDate, endDate]);

  const reports = [
    { id: "booking", label: "Booking Report", icon: FileText },
    { id: "revenue", label: "Revenue Report", icon: DollarSign },
    { id: "occupancy", label: "Occupancy Report", icon: Bed },
    { id: "customer", label: "Customer Report", icon: Users },
    { id: "cancellation", label: "Cancellation Report", icon: XCircle },
  ];

  return (
    <AppShell>
      <div className="topbar">
        <div className="topbar-left"><h1 className="topbar-title">Reports</h1></div>
      </div>

      <div className="filter-pills mb-6">
        {reports.map((r) => (
          <button key={r.id} onClick={() => setActiveReport(r.id)} className={`filter-pill ${activeReport === r.id ? "active" : ""}`}>
            <r.icon size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />{r.label}
          </button>
        ))}
      </div>

      <div className="flex gap-4 mb-6">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">From</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="form-input" />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">To</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="form-input" />
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={async () => {
            try {
              const params = new URLSearchParams();
              if (startDate) params.set("startDate", startDate);
              if (endDate) params.set("endDate", endDate);
              const { data } = await api.get(`/reports/export/bookings?format=pdf&${params.toString()}`, { responseType: "blob" });
              const url = window.URL.createObjectURL(new Blob([data]));
              const a = document.createElement("a"); a.href = url; a.download = "bookings-report.pdf"; a.click();
              window.URL.revokeObjectURL(url);
              toast.success("PDF exported");
            } catch { toast.error("Export failed"); }
          }}
          className="btn btn-secondary btn-sm"
        >
          <Download size={14} /> Export PDF
        </button>
        <button
          onClick={async () => {
            try {
              const params = new URLSearchParams();
              if (startDate) params.set("startDate", startDate);
              if (endDate) params.set("endDate", endDate);
              const { data } = await api.get(`/reports/export/bookings?format=excel&${params.toString()}`, { responseType: "blob" });
              const url = window.URL.createObjectURL(new Blob([data]));
              const a = document.createElement("a"); a.href = url; a.download = "bookings-report.xlsx"; a.click();
              window.URL.revokeObjectURL(url);
              toast.success("Excel exported");
            } catch { toast.error("Export failed"); }
          }}
          className="btn btn-secondary btn-sm"
        >
          <FileSpreadsheet size={14} /> Export Excel
        </button>
      </div>

      {loading ? <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}><LoadingSpinner size="lg" /></div> : (
        <div className="card">
          {activeReport === "booking" && data && (
            <>
              <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                <div className="stat-card"><div className="stat-card-icon blue"><FileText size={20} /></div><div className="stat-card-value">{data.totalBookings}</div><div className="stat-card-label">Total Bookings</div></div>
                <div className="stat-card"><div className="stat-card-icon green"><DollarSign size={20} /></div><div className="stat-card-value">${(data.totalRevenue || 0).toFixed(0)}</div><div className="stat-card-label">Total Revenue</div></div>
                <div className="stat-card"><div className="stat-card-icon purple"><Bed size={20} /></div><div className="stat-card-value">{data.statusBreakdown?.length || 0}</div><div className="stat-card-label">Status Types</div></div>
              </div>
              {data.statusBreakdown?.map((s: any) => (
                <div key={s.status} className="flex items-center justify-between" style={{ padding: "12px", background: "var(--bg)", borderRadius: "var(--radius)", marginBottom: "8px" }}>
                  <span>{s.status.replace(/_/g, " ")}</span>
                  <div><span style={{ fontWeight: 600, marginRight: "16px" }}>{s.count} bookings</span><span style={{ fontWeight: 700, color: "var(--success)" }}>${(s.totalAmount || 0).toFixed(2)}</span></div>
                </div>
              ))}
            </>
          )}
          {activeReport === "revenue" && data && (
            <>
              <div className="grid-2 mb-6">
                <div className="stat-card"><div className="stat-card-icon green"><DollarSign size={20} /></div><div className="stat-card-value">${(data.totalRevenue || 0).toFixed(2)}</div><div className="stat-card-label">Total Revenue</div></div>
                <div className="stat-card"><div className="stat-card-icon blue"><FileText size={20} /></div><div className="stat-card-value">{data.totalTransactions}</div><div className="stat-card-label">Transactions</div></div>
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: "12px" }}>By Payment Method</h3>
              {data.methodBreakdown?.map((m: any) => (
                <div key={m.method} className="flex items-center justify-between" style={{ padding: "12px", background: "var(--bg)", borderRadius: "var(--radius)", marginBottom: "8px" }}>
                  <span>{m.method.replace(/_/g, " ")}</span>
                  <div><span style={{ fontWeight: 600, marginRight: "16px" }}>{m.count}</span><span style={{ fontWeight: 700, color: "var(--success)" }}>${(m.total || 0).toFixed(2)}</span></div>
                </div>
              ))}
            </>
          )}
          {activeReport === "occupancy" && data && (
            <>
              <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                {[
                  { label: "Total Rooms", value: data.totalRooms, color: "blue" },
                  { label: "Occupied", value: data.occupiedRooms, color: "red" },
                  { label: "Available", value: data.availableRooms, color: "green" },
                  { label: "Occupancy Rate", value: `${data.occupancyRate}%`, color: "purple" },
                ].map((s, i) => (
                  <div key={i} className="stat-card"><div className={`stat-card-icon ${s.color}`}><Bed size={20} /></div><div className="stat-card-value">{s.value}</div><div className="stat-card-label">{s.label}</div></div>
                ))}
              </div>
              {data.statusBreakdown?.map((s: any) => (
                <div key={s.status} className="flex items-center justify-between" style={{ padding: "12px", background: "var(--bg)", borderRadius: "var(--radius)", marginBottom: "8px" }}>
                  <span>{s.status.replace(/_/g, " ")}</span><span style={{ fontWeight: 600 }}>{s.count} rooms</span>
                </div>
              ))}
            </>
          )}
          {activeReport === "customer" && data && (
            <>
              <div className="grid-2 mb-6">
                <div className="stat-card"><div className="stat-card-icon blue"><Users size={20} /></div><div className="stat-card-value">{data.totalCustomers}</div><div className="stat-card-label">Total Customers</div></div>
                <div className="stat-card"><div className="stat-card-icon green"><Users size={20} /></div><div className="stat-card-value">{data.newCustomersThisMonth}</div><div className="stat-card-label">New This Month</div></div>
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: "12px" }}>Top Customers</h3>
              {data.topCustomers?.map((c: any, i: number) => (
                <div key={c.id} className="flex items-center justify-between" style={{ padding: "12px", background: "var(--bg)", borderRadius: "var(--radius)", marginBottom: "8px" }}>
                  <div className="flex items-center gap-3"><span style={{ fontWeight: 800, color: "var(--muted)" }}>#{i + 1}</span><span style={{ fontWeight: 600 }}>{c.firstName} {c.lastName}</span></div>
                  <div style={{ textAlign: "right" }}><span className="text-sm color-muted">{c._count?.bookings} bookings</span><span style={{ fontWeight: 700, color: "var(--success)", marginLeft: "16px" }}>${(c.totalSpent || 0).toFixed(2)}</span></div>
                </div>
              ))}
            </>
          )}
          {activeReport === "cancellation" && data && (
            <>
              <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                <div className="stat-card"><div className="stat-card-icon red"><XCircle size={20} /></div><div className="stat-card-value">{data.totalCancelled}</div><div className="stat-card-label">Cancelled</div></div>
                <div className="stat-card"><div className="stat-card-icon orange"><XCircle size={20} /></div><div className="stat-card-value">{data.cancellationRate}%</div><div className="stat-card-label">Cancellation Rate</div></div>
                <div className="stat-card"><div className="stat-card-icon purple"><DollarSign size={20} /></div><div className="stat-card-value">${(data.lostRevenue || 0).toFixed(0)}</div><div className="stat-card-label">Lost Revenue</div></div>
              </div>
              {data.cancelledBookings?.slice(0, 10).map((b: any) => (
                <div key={b.id} className="flex items-center justify-between" style={{ padding: "12px", background: "var(--bg)", borderRadius: "var(--radius)", marginBottom: "8px" }}>
                  <div><span style={{ fontWeight: 600 }}>{b.bookingNumber}</span><span className="text-sm color-muted" style={{ marginLeft: "8px" }}>{b.user?.firstName} {b.user?.lastName}</span></div>
                  <span style={{ fontWeight: 700, color: "var(--danger)" }}>${b.totalAmount.toFixed(2)}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </AppShell>
  );
}
