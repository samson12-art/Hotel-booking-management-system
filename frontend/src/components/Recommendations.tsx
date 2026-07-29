"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Star, MapPin, Sparkles } from "lucide-react";

interface Recommendation {
  id: string;
  name: string;
  address: string;
  city: { name: string };
  starRating: number;
  averageRating: number;
  minPrice: number;
  matchScore: number;
  reason: string;
}

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const { data } = await api.get("/recommendations");
        setRecommendations(data.data || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recommended for You</h2>
          <Sparkles size={20} style={{ color: "var(--accent)" }} />
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ flex: 1, height: "180px", borderRadius: "var(--radius)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Recommended for You</h2>
        <Sparkles size={20} style={{ color: "var(--accent)" }} />
      </div>
      <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "4px" }}>
        {recommendations.map((hotel) => (
          <Link
            key={hotel.id}
            href={`/hotels/${hotel.id}`}
            style={{
              flex: "0 0 260px",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              background: "var(--surface)",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ padding: "16px" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="badge badge-teal">{Math.round(hotel.matchScore)}% Match</span>
                <div className="flex items-center gap-1">
                  <Star size={12} style={{ fill: "#fbbf24", color: "#fbbf24" }} />
                  <span className="text-sm" style={{ fontWeight: 600 }}>{hotel.averageRating || "New"}</span>
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "4px" }}>{hotel.name}</div>
              <div className="flex items-center gap-1 text-sm color-muted mb-2">
                <MapPin size={12} />
                <span>{hotel.city?.name}</span>
              </div>
              <div style={{ display: "flex", gap: "2px", marginBottom: "8px" }}>
                {Array.from({ length: hotel.starRating }).map((_, i) => (
                  <Star key={i} size={10} style={{ fill: "#fbbf24", color: "#fbbf24" }} />
                ))}
              </div>
              <div className="text-sm color-muted mb-2" style={{ lineHeight: 1.4 }}>
                {hotel.reason}
              </div>
              <div className="color-accent" style={{ fontWeight: 800, fontSize: "18px" }}>
                ${hotel.minPrice} <span className="text-sm color-muted" style={{ fontWeight: 400 }}>/ night</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
