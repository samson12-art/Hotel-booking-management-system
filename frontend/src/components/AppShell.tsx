"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      {mobileOpen && <div className="sidebar-overlay active" onClick={() => setMobileOpen(false)} />}
      <main className="workspace">
        <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
          <Menu size={22} />
        </button>
        {children}
      </main>
    </div>
  );
}
