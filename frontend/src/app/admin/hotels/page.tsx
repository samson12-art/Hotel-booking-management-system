"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import AppShell from "@/components/AppShell";
import Pagination from "@/components/Pagination";
import toast from "react-hot-toast";
import { Trash2, Star } from "lucide-react";

export default function AdminHotelsPage() {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/hotels?page=${page}&limit=10`);
      setHotels(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchHotels(); }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this hotel?")) return;
    try {
      await api.delete(`/hotels/${id}`);
      toast.success("Hotel deleted");
      fetchHotels();
    } catch (error: any) { toast.error(error.response?.data?.message || "Failed"); }
  };

  return (
    <AppShell>
      <div className="topbar">
        <div className="topbar-left"><h1 className="topbar-title">Manage Hotels</h1></div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Hotel</th>
              <th>Location</th>
              <th>Rating</th>
              <th>Rooms</th>
              <th>Bookings</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {hotels.map((h: any) => (
              <tr key={h.id}>
                <td style={{ fontWeight: 600 }}>{h.name}</td>
                <td className="color-muted">{h.city?.name}</td>
                <td>
                  <div className="flex items-center gap-1">
                    <Star size={12} style={{ fill: "#fbbf24", color: "#fbbf24" }} />
                    <span>{h.starRating}</span>
                  </div>
                </td>
                <td>{h._count?.rooms}</td>
                <td>{h._count?.bookings}</td>
                <td><span className={`badge ${h.isActive ? "badge-green" : "badge-red"}`}>{h.isActive ? "Active" : "Inactive"}</span></td>
                <td>
                  <button onClick={() => handleDelete(h.id)} className="btn btn-danger btn-icon btn-sm">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </AppShell>
  );
}
