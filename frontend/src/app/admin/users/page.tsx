"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import AppShell from "@/components/AppShell";
import Pagination from "@/components/Pagination";
import toast from "react-hot-toast";
import { Search, Trash2 } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      const { data } = await api.get(`/users?${params.toString()}`);
      setUsers(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, roleFilter]);

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await api.put(`/users/${userId}/role`, { role });
      toast.success("Role updated");
      fetchUsers();
    } catch (error: any) { toast.error(error.response?.data?.message || "Failed"); }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success("User deleted");
      fetchUsers();
    } catch (error: any) { toast.error(error.response?.data?.message || "Failed"); }
  };

  return (
    <AppShell>
      <div className="topbar">
        <div className="topbar-left"><h1 className="topbar-title">Manage Users</h1></div>
      </div>

      <div className="flex gap-4 mb-6" style={{ flexWrap: "wrap" }}>
        <div className="form-input-icon" style={{ flex: 1, minWidth: "250px" }}>
          <Search size={18} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fetchUsers()} className="form-input" placeholder="Search users..." />
        </div>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="form-input" style={{ width: "auto", minWidth: "150px" }}>
          <option value="">All Roles</option>
          <option value="CUSTOMER">Customer</option>
          <option value="HOTEL_MANAGER">Hotel Manager</option>
          <option value="STAFF">Staff</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Verified</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--accent-light)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>
                      {u.firstName?.[0]}{u.lastName?.[0]}
                    </div>
                    <span style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</span>
                  </div>
                </td>
                <td className="color-muted">{u.email}</td>
                <td>
                  <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)} className="form-input" style={{ padding: "4px 8px", fontSize: "12px", width: "auto", minHeight: "auto" }}>
                    {["CUSTOMER", "HOTEL_MANAGER", "STAFF", "ADMIN"].map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
                  </select>
                </td>
                <td><span className={`badge ${u.isVerified ? "badge-green" : "badge-yellow"}`}>{u.isVerified ? "Yes" : "No"}</span></td>
                <td className="color-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleDelete(u.id)} className="btn btn-danger btn-icon btn-sm">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && !loading && <div className="empty-state"><p>No users found</p></div>}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </AppShell>
  );
}
