"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Hotel, CalendarCheck, Users, CreditCard, FileText, Bell, Settings, Tag, MapPin, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const sidebarItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Hotels", href: "/admin/hotels", icon: Hotel },
  { label: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Reports", href: "/admin/reports", icon: FileText },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`bg-gray-900 text-white min-h-screen transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          {!collapsed && <span className="text-lg font-bold">Admin Panel</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-gray-800 rounded">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <nav className="mt-4">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                isActive ? "bg-primary-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
