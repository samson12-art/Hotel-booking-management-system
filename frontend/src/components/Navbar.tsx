"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/context/ThemeContext";
import CurrencySelector from "@/components/CurrencySelector";
import LanguageSelector from "@/components/LanguageSelector";
import { Menu, X, User, LogOut, ChevronDown, Hotel, Bell, MessageCircle, Sun, Moon, Sparkles } from "lucide-react";

export default function Navbar() {
  const { user, logout, loadUser } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadChat, setUnreadChat] = useState(0);

  useEffect(() => { loadUser(); }, [loadUser]);

  useEffect(() => {
    if (user) {
      const fetchUnread = async () => {
        try {
          const { data } = await api.get("/chat");
          const total = data.data?.unreadCount || 0;
          setUnreadChat(total);
        } catch { /* ignore */ }
      };
      fetchUnread();
      const interval = setInterval(fetchUnread, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const getDashboardLink = () => {
    if (!user) return "/";
    switch (user.role) {
      case "ADMIN": return "/admin/dashboard";
      case "HOTEL_MANAGER": return "/manager/dashboard";
      default: return "/dashboard";
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Hotel className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-primary-600">StayEase</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <Link href="/hotels" className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium">Hotels</Link>
            {user ? (
              <>
                <Link href="/contact" className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium">Contact</Link>
                <Link href={getDashboardLink()} className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium">Dashboard</Link>
                <Link href="/dashboard?tab=recommendations" className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium flex items-center gap-1">
                  <Sparkles size={14} /> Recommendations
                </Link>
                <Link href="/chat" className="text-gray-600 hover:text-primary-600 p-2 relative">
                  <MessageCircle className="h-5 w-5" />
                  {unreadChat > 0 && (
                    <span style={{
                      position: "absolute", top: "4px", right: "4px", width: "16px", height: "16px",
                      borderRadius: "50%", background: "var(--danger)", color: "#fff",
                      fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      {unreadChat}
                    </span>
                  )}
                </Link>
                <Link href="/notifications" className="text-gray-600 hover:text-primary-600 p-2">
                  <Bell className="h-5 w-5" />
                </Link>
                <button onClick={toggleTheme} className="text-gray-600 hover:text-primary-600 p-2" title={theme === "light" ? "Dark Mode" : "Light Mode"}>
                  {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </button>
                <CurrencySelector />
                <LanguageSelector />
                <div className="relative">
                  <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center space-x-2 text-gray-600 hover:text-primary-600">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-600" />
                    </div>
                    <span className="text-sm font-medium">{user.firstName}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setShowDropdown(false)}>Profile</Link>
                      <Link href={getDashboardLink()} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setShowDropdown(false)}>Dashboard</Link>
                      <button onClick={() => { handleLogout(); setShowDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center space-x-2">
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium">Login</Link>
                <Link href="/auth/register" className="btn-primary text-sm">Sign Up</Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 hover:text-gray-900">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/hotels" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50">Hotels</Link>
            <Link href="/contact" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50">Contact</Link>
            {user ? (
              <>
                <Link href={getDashboardLink()} className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50">Dashboard</Link>
                <Link href="/dashboard?tab=recommendations" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50 flex items-center gap-1">
                  <Sparkles size={16} /> Recommendations
                </Link>
                <Link href="/chat" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50">Chat</Link>
                <div className="flex items-center gap-2 px-3 py-2">
                  <CurrencySelector />
                  <LanguageSelector />
                </div>
                <button onClick={toggleTheme} className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50">
                  {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                  {theme === "light" ? "Dark Mode" : "Light Mode"}
                </button>
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-50">Logout</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50">Login</Link>
                <Link href="/auth/register" className="block px-3 py-2 rounded-md text-base font-medium text-primary-600 hover:bg-gray-50">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
