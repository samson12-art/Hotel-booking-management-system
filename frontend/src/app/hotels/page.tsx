"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import AppShell from "@/components/AppShell";
import RoomCard from "@/components/RoomCard";
import Pagination from "@/components/Pagination";
import { SlidersHorizontal, X } from "lucide-react";

function RoomsContent() {
  const searchParams = useSearchParams();
  const [hotelId, setHotelId] = useState<string>("");
  const [rooms, setRooms] = useState<any[]>([]);
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    query: searchParams.get("query") || "",
    type: "",
    minPrice: "",
    maxPrice: "",
    sortBy: "",
  });

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const res = await api.get("/hotels?limit=1");
        const h = res.data.data?.[0];
        if (h) {
          setHotelId(h.id);
          const detailRes = await api.get(`/hotels/${h.id}`);
          const roomList = detailRes.data.data?.rooms || [];
          setAllRooms(roomList);
        }
      } catch (error) {
        console.error("Failed to fetch hotel:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHotel();
  }, []);

  useEffect(() => {
    let filtered = [...allRooms];

    if (filters.query) {
      const q = filters.query.toLowerCase();
      filtered = filtered.filter((r: any) =>
        r.roomNumber.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q))
      );
    }

    if (filters.type) {
      filtered = filtered.filter((r: any) => r.type === filters.type);
    }

    if (filters.minPrice) {
      filtered = filtered.filter((r: any) => r.price >= Number(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter((r: any) => r.price <= Number(filters.maxPrice));
    }

    if (filters.sortBy === "price_asc") {
      filtered.sort((a: any, b: any) => a.price - b.price);
    } else if (filters.sortBy === "price_desc") {
      filtered.sort((a: any, b: any) => b.price - a.price);
    }

    const perPage = 6;
    setTotalPages(Math.max(1, Math.ceil(filtered.length / perPage)));
    const start = (page - 1) * perPage;
    setRooms(filtered.slice(start, start + perPage));
  }, [allRooms, filters, page]);

  const updateFilter = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const availableCount = allRooms.filter((r: any) => r.status === "AVAILABLE").length;

  return (
    <AppShell>
      <div className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">XY Hotel Rooms</h1>
          <p className="topbar-subtitle">{loading ? "Loading..." : `${availableCount} rooms available`}</p>
        </div>
        <div className="topbar-right">
          <select value={filters.sortBy} onChange={(e) => updateFilter("sortBy", e.target.value)} className="form-input" style={{ width: "auto" }}>
            <option value="">Sort by</option>
            <option value="price_asc">Lowest Price</option>
            <option value="price_desc">Highest Price</option>
          </select>
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-secondary btn-sm">
            <SlidersHorizontal size={14} /> Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontWeight: 700 }}>Filter Rooms</h3>
            <button onClick={() => setShowFilters(false)}><X size={18} /></button>
          </div>
          <div className="grid-4">
            <div className="form-group">
              <label className="form-label">Room Type</label>
              <select value={filters.type} onChange={(e) => updateFilter("type", e.target.value)} className="form-input">
                <option value="">All Types</option>
                <option value="STANDARD">Standard</option>
                <option value="DELUXE">Deluxe</option>
                <option value="SUITE">Suite</option>
                <option value="FAMILY">Family</option>
                <option value="EXECUTIVE">Executive</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Min Price ($)</label>
              <input type="number" value={filters.minPrice} onChange={(e) => updateFilter("minPrice", e.target.value)} className="form-input" placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Max Price ($)</label>
              <input type="number" value={filters.maxPrice} onChange={(e) => updateFilter("maxPrice", e.target.value)} className="form-input" placeholder="500" />
            </div>
            <div className="form-group">
              <label className="form-label">&nbsp;</label>
              <button onClick={() => setFilters({ query: "", type: "", minPrice: "", maxPrice: "", sortBy: "" })} className="btn btn-secondary w-full">Clear Filters</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card">
              <div className="skeleton" style={{ height: "200px", marginBottom: "16px" }} />
              <div className="skeleton" style={{ height: "20px", width: "70%", marginBottom: "8px" }} />
              <div className="skeleton" style={{ height: "14px", width: "50%" }} />
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="empty-state">
          <p>No rooms found matching your criteria.</p>
          <button onClick={() => setFilters({ query: "", type: "", minPrice: "", maxPrice: "", sortBy: "" })} className="btn btn-primary" style={{ marginTop: "12px" }}>Clear Filters</button>
        </div>
      ) : (
        <div className="grid-3">
          {rooms.map((room: any) => <RoomCard key={room.id} room={room} hotelId={hotelId} />)}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </AppShell>
  );
}

export default function HotelsPage() {
  return (
    <Suspense fallback={<AppShell><div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>Loading...</div></AppShell>}>
      <RoomsContent />
    </Suspense>
  );
}
