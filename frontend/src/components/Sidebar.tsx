"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/context/ThemeContext";
import {
  Home, Bed, CalendarCheck, CreditCard, Users, FileText,
  BarChart3, Bell, Star, LogOut, Moon, Sun,
  LayoutDashboard, Settings, Menu, X, Shield, Receipt
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const customerNav = [
  { label: "Home", href: "/", icon: Home },
  { label: "Rooms", href: "/hotels", icon: Bed },
  { label: "My Bookings", href: "/dashboard", icon: CalendarCheck },
  { label: "My Receipts", href: "/dashboard/receipts", icon: Receipt },
  { label: "Reviews", href: "/dashboard?tab=reviews", icon: Star },
  { label: "Payments", href: "/dashboard?tab=payments", icon: CreditCard },
  { label: "Verify ID", href: "/profile/verify", icon: Shield },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Profile", href: "/profile", icon: Users },
];

const managerNav = [
  { label: "Home", href: "/", icon: Home },
  { label: "Dashboard", href: "/manager/dashboard", icon: LayoutDashboard },
  { label: "Rooms", href: "/manager/dashboard", icon: Bed },
  { label: "Bookings", href: "/manager/dashboard", icon: CalendarCheck },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Profile", href: "/profile", icon: Users },
];

const adminNav = [
  { label: "Home", href: "/", icon: Home },
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Rooms", href: "/admin/hotels", icon: Bed },
  { label: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
  { label: "Guests", href: "/admin/users", icon: Users },
  { label: "ID Verifications", href: "/admin/verifications", icon: Shield },
  { label: "Receipts", href: "/admin/receipts", icon: Receipt },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Reports", href: "/admin/reports", icon: FileText },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const getNavItems = () => {
    switch (user?.role) {
      case "ADMIN": return adminNav;
      case "HOTEL_MANAGER": return managerNav;
      default: return customerNav;
    }
  };

  const navItems = getNavItems();
  const initials = user ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}` : "?";
  const roleName = user?.role?.replace(/_/g, " ") || "Guest";

  return (
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="sidebar-brand">
        <Bed size={24} />
        <span>XY Hotel</span>
        {mobileOpen && (
          <button onClick={onMobileClose} style={{ marginLeft: "auto", color: "#fff" }}>
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Navigation</div>
          {navItems.map((item) => {
            const [itemPath, itemQs] = item.href.split("?");
            let isActive = false;
            if (pathname === itemPath) {
              if (!itemQs) {
                isActive = searchParams.toString() === "";
              } else {
                const required = new URLSearchParams(itemQs);
                isActive = Array.from(required.keys()).every(
                  (k) => searchParams.get(k) === required.get(k)
                );
              }
            }
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={`sidebar-link ${isActive ? "active" : ""}`}
                onClick={onMobileClose}
              >
                <item.icon />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-theme-toggle" onClick={toggleTheme}>
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
        </button>

        {user && (
          <>
            <div className="sidebar-user" style={{ marginTop: "8px" }}>
              <div className="sidebar-user-avatar">{initials}</div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user.firstName} {user.lastName}</div>
                <div className="sidebar-user-role">{roleName}</div>
              </div>
            </div>
            <button className="sidebar-logout" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
