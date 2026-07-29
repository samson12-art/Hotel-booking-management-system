"use client";

import Link from "next/link";
import { Star, MapPin, Heart } from "lucide-react";
import { useState } from "react";

interface HotelCardProps {
  hotel: {
    id: string;
    name: string;
    address: string;
    starRating: number;
    averageRating: number;
    minPrice: number;
    images?: { url: string }[];
    primaryImage?: { url: string } | null;
    city: { name: string };
    _count: { reviews: number };
  };
}

export default function HotelCard({ hotel }: HotelCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <div className="hotel-card">
      <Link href={`/hotels/${hotel.id}`}>
        <div className="hotel-card-image">
          {hotel.primaryImage ? (
            <img src={`http://localhost:5000${hotel.primaryImage.url}`} alt={hotel.name} />
          ) : hotel.images?.[0] ? (
            <img src={`http://localhost:5000${hotel.images[0].url}`} alt={hotel.name} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
              No Image
            </div>
          )}
          <button
            onClick={(e) => { e.preventDefault(); setIsFavorite(!isFavorite); }}
            style={{ position: "absolute", top: "12px", right: "12px", padding: "8px", background: "var(--surface)", borderRadius: "50%", boxShadow: "var(--shadow-sm)" }}
          >
            <Heart size={18} style={{ fill: isFavorite ? "#ef4444" : "none", color: isFavorite ? "#ef4444" : "var(--muted)" }} />
          </button>
        </div>
      </Link>

      <div className="hotel-card-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Link href={`/hotels/${hotel.id}`}>
            <h3 className="hotel-card-title">{hotel.name}</h3>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
            <Star size={14} style={{ fill: "#fbbf24", color: "#fbbf24" }} />
            <span style={{ fontSize: "13px", fontWeight: 600 }}>{hotel.averageRating || "New"}</span>
          </div>
        </div>

        <div className="hotel-card-location">
          <MapPin size={14} />
          <span>{hotel.city?.name}, {hotel.address}</span>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "8px" }}>
          {Array.from({ length: hotel.starRating }).map((_, i) => (
            <Star key={i} size={12} style={{ fill: "#fbbf24", color: "#fbbf24" }} />
          ))}
        </div>

        <div className="hotel-card-price">
          <span className="price">${hotel.minPrice}</span>
          <span className="per-night">/ night</span>
          <span className="reviews">{hotel._count.reviews} reviews</span>
        </div>
      </div>
    </div>
  );
}
