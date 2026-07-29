"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/notifications?limit=50");
      setNotifications(data.data?.notifications || []);
      setUnreadCount(data.data?.unreadCount || 0);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) { toast.error("Failed"); }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All marked as read");
    } catch (error) { toast.error("Failed"); }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Deleted");
    } catch (error) { toast.error("Failed"); }
  };

  return (
    <AppShell>
      <div className="topbar">
        <div className="topbar-left">
          <div className="flex items-center gap-3">
            <h1 className="topbar-title">Notifications</h1>
            {unreadCount > 0 && <span className="badge badge-teal">{unreadCount} new</span>}
          </div>
        </div>
        <div className="topbar-right">
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="btn btn-secondary btn-sm">
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: "80px" }} />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <Bell size={48} style={{ margin: "0 auto 16px", opacity: 0.4 }} />
          <p>No notifications</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {notifications.map((n) => (
            <div key={n.id} className={`notification-card ${!n.isRead ? "unread" : ""}`}>
              <div className={`notification-icon ${!n.isRead ? "unread" : "read"}`}>
                <Bell size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 600, fontSize: "14px" }}>{n.title}</h3>
                <p className="text-sm color-muted" style={{ marginTop: "4px" }}>{n.message}</p>
                <p className="text-sm" style={{ color: "var(--muted)", marginTop: "4px", fontSize: "12px" }}>{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                {!n.isRead && <button onClick={() => markAsRead(n.id)} className="btn btn-primary btn-icon btn-sm" title="Mark as read"><Check size={14} /></button>}
                <button onClick={() => deleteNotification(n.id)} className="btn btn-danger btn-icon btn-sm" title="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
