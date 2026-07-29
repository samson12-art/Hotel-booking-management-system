"use client";

import { useState } from "react";
import { Search, MapPin, Calendar, Users } from "lucide-react";

interface SearchBarProps {
  onSearch: (filters: any) => void;
  compact?: boolean;
}

export default function SearchBar({ onSearch, compact }: SearchBarProps) {
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ query: destination, checkIn, checkOut, guests });
  };

  if (compact) {
    return (
      <form onSubmit={handleSearch} className="search-bar search-bar-compact">
        <input type="text" placeholder="Where are you going?" value={destination} onChange={(e) => setDestination(e.target.value)} />
        <button type="submit" className="btn btn-primary">Search</button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSearch} className="card" style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
      <div className="form-group" style={{ flex: 1, minWidth: "180px", marginBottom: 0 }}>
        <label className="form-label">Destination</label>
        <div className="form-input-icon">
          <MapPin size={18} />
          <input type="text" placeholder="City or hotel name" value={destination} onChange={(e) => setDestination(e.target.value)} className="form-input" />
        </div>
      </div>
      <div className="form-group" style={{ flex: 1, minWidth: "160px", marginBottom: 0 }}>
        <label className="form-label">Check In</label>
        <div className="form-input-icon">
          <Calendar size={18} />
          <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="form-input" />
        </div>
      </div>
      <div className="form-group" style={{ flex: 1, minWidth: "160px", marginBottom: 0 }}>
        <label className="form-label">Check Out</label>
        <div className="form-input-icon">
          <Calendar size={18} />
          <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="form-input" />
        </div>
      </div>
      <div className="form-group" style={{ flex: 1, minWidth: "120px", marginBottom: 0 }}>
        <label className="form-label">Guests</label>
        <div className="form-input-icon">
          <Users size={18} />
          <input type="number" min={1} max={20} value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="form-input" />
        </div>
      </div>
      <button type="submit" className="btn btn-primary" style={{ minWidth: "120px" }}>
        <Search size={18} /> Search
      </button>
    </form>
  );
}
