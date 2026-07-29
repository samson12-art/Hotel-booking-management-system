"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import AppShell from "@/components/AppShell";
import Pagination from "@/components/Pagination";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (statusFilter) params.set("status", statusFilter);
      const { data } = await api.get(`/payments?${params.toString()}`);
      setPayments(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPayments(); }, [page, statusFilter]);

  const statusBadge: Record<string, string> = { COMPLETED: "badge-green", PENDING: "badge-yellow", FAILED: "badge-red", REFUNDED: "badge-purple" };

  return (
    <AppShell>
      <div className="topbar">
        <div className="topbar-left"><h1 className="topbar-title">Payments</h1></div>
        <div className="topbar-right">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="form-input" style={{ width: "auto" }}>
            <option value="">All Status</option>
            {["COMPLETED", "PENDING", "FAILED", "REFUNDED"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Hotel</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p: any) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600, fontSize: "13px" }}>{p.invoiceNumber}</td>
                <td>{p.user?.firstName} {p.user?.lastName}</td>
                <td>{p.booking?.hotel?.name}</td>
                <td>{p.method.replace(/_/g, " ")}</td>
                <td style={{ fontWeight: 700, color: "var(--success)" }}>${p.amount.toFixed(2)}</td>
                <td><span className={`badge ${statusBadge[p.status] || "badge-gray"}`}>{p.status}</span></td>
                <td className="color-muted">{new Date(p.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && !loading && <div className="empty-state"><p>No payments found</p></div>}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </AppShell>
  );
}
