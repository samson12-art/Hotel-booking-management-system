"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import AppShell from "@/components/AppShell";
import RoomCard from "@/components/RoomCard";
import { Star, Shield, CreditCard, Headphones, MapPin, Search, Wifi, UtensilsCrossed, Car, Dumbbell, Waves, Sparkles, Phone } from "lucide-react";

export default function HomePage() {
  const [hotel, setHotel] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const hotelsRes = await api.get("/hotels?limit=1");
        const hotelData = hotelsRes.data.data?.[0];
        if (hotelData) {
          setHotel(hotelData);
          const [roomsRes, reviewsRes] = await Promise.all([
            api.get(`/hotels/${hotelData.id}`),
            api.get(`/hotels/${hotelData.id}/reviews`).catch(() => ({ data: { data: [] } })),
          ]);
          setRooms(roomsRes.data.data?.rooms || []);
          setReviews(reviewsRes.data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/hotels?query=${encodeURIComponent(searchQuery)}`;
    }
  };

  const hotelAmenities = [
    { icon: Wifi, name: "Free WiFi" },
    { icon: Waves, name: "Swimming Pool" },
    { icon: Dumbbell, name: "Gym & Fitness" },
    { icon: Sparkles, name: "Spa & Wellness" },
    { icon: UtensilsCrossed, name: "Restaurant & Bar" },
    { icon: Car, name: "Free Parking" },
  ];

  return (
    <AppShell>
      {/* Hero */}
      <div className="hero" style={{ minHeight: "420px", background: "linear-gradient(135deg, #0a1a17 0%, #136f63 50%, #1a8a7a 100%)" }}>
        <h1 style={{ fontSize: "36px", marginBottom: "12px" }}>Welcome to XY Hotel</h1>
        <p style={{ fontSize: "18px", maxWidth: "600px", margin: "0 auto 24px" }}>
          Experience world-class luxury in the heart of Addis Ababa. Ethiopian hospitality meets international standards.
        </p>
        <form onSubmit={handleSearch} className="search-bar search-bar-compact">
          <input
            type="text"
            placeholder="Search rooms by type or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            <Search size={18} /> Search
          </button>
        </form>
      </div>

      {/* Quick Info Strip */}
      <div className="card" style={{ display: "flex", justifyContent: "space-around", padding: "20px", marginTop: "-28px", position: "relative", zIndex: 10, flexWrap: "wrap", gap: "16px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--accent)" }}>{hotel?.starRating || 5}</div>
          <div className="text-sm color-muted">Star Rating</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--accent)" }}>{rooms.length || 19}</div>
          <div className="text-sm color-muted">Rooms</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--accent)" }}>{reviews.length || 2}</div>
          <div className="text-sm color-muted">Reviews</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--accent)" }}>24/7</div>
          <div className="text-sm color-muted">Service</div>
        </div>
      </div>

      {/* Amenities */}
      <div className="section">
        <h2 className="section-title">Hotel Amenities</h2>
        <p className="color-muted" style={{ marginBottom: "20px" }}>Everything you need for a comfortable and memorable stay</p>
        <div className="grid-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
          {hotelAmenities.map((a, i) => (
            <div key={i} className="stat-card stat-card-horizontal" style={{ padding: "16px" }}>
              <div className="stat-card-icon teal">
                <a.icon size={20} />
              </div>
              <div style={{ fontWeight: 600, fontSize: "14px" }}>{a.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Our Rooms */}
      <div className="section">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Our Rooms</h2>
            <p className="text-sm color-muted" style={{ marginTop: "4px" }}>Choose from our selection of beautifully appointed rooms</p>
          </div>
          <Link href="/hotels" className="btn btn-secondary btn-sm">View All Rooms</Link>
        </div>

        {loading ? (
          <div className="grid-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card">
                <div className="skeleton" style={{ height: "180px", marginBottom: "16px" }} />
                <div className="skeleton" style={{ height: "20px", width: "70%", marginBottom: "8px" }} />
                <div className="skeleton" style={{ height: "14px", width: "50%" }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid-3">
            {rooms.slice(0, 6).map((room: any) => (
              <RoomCard key={room.id} room={room} hotelId={hotel?.id} />
            ))}
          </div>
        )}
      </div>

      {/* About XY Hotel */}
      <div className="section">
        <div className="card" style={{ padding: "32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", alignItems: "center" }}>
          <div>
            <h2 className="section-title">About XY Hotel</h2>
            <p style={{ lineHeight: 1.8, marginBottom: "16px" }}>
              XY Hotel is a premier luxury destination in Addis Ababa, Ethiopia. Located on the iconic Bole Road,
              we offer easy access to the city&apos;s business district, embassies, and cultural attractions.
            </p>
            <p style={{ lineHeight: 1.8, marginBottom: "20px" }}>
              Our hotel features 19 elegantly designed rooms across 5 categories, from comfortable Standard rooms
              to our exclusive Executive suites. Each room is thoughtfully appointed with modern amenities and
              traditional Ethiopian touches.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }} className="text-sm">
                <MapPin size={14} style={{ color: "var(--accent)" }} /> Bole Road, Addis Ababa
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }} className="text-sm">
                <Phone size={14} style={{ color: "var(--accent)" }} /> +251-11-661-8888
              </div>
            </div>
          </div>
          <div style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", borderRadius: "12px", padding: "32px", color: "#fff", textAlign: "center" }}>
            <div style={{ fontSize: "48px", fontWeight: 800, marginBottom: "8px" }}>5★</div>
            <div style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px" }}>Luxury Hotel</div>
            <div style={{ fontSize: "14px", opacity: 0.9 }}>in Addis Ababa, Ethiopia</div>
            <div style={{ marginTop: "20px", display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
              <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "20px", fontSize: "12px" }}>Spa</span>
              <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "20px", fontSize: "12px" }}>Pool</span>
              <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "20px", fontSize: "12px" }}>Restaurant</span>
              <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "20px", fontSize: "12px" }}>Gym</span>
            </div>
          </div>
        </div>
      </div>

      {/* Guest Reviews */}
      {reviews.length > 0 && (
        <div className="section">
          <h2 className="section-title">What Our Guests Say</h2>
          <div className="grid-2">
            {reviews.map((review: any) => (
              <div key={review.id} className="card" style={{ padding: "24px" }}>
                <div style={{ display: "flex", gap: "4px", marginBottom: "12px" }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={16} fill={s <= review.rating ? "#f59e0b" : "none"} stroke={s <= review.rating ? "#f59e0b" : "#6b7280"} />
                  ))}
                </div>
                <p style={{ lineHeight: 1.7, marginBottom: "16px" }}>&ldquo;{review.comment}&rdquo;</p>
                <div className="text-sm color-muted">
                  — {review.user?.firstName} {review.user?.lastName}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="section">
        <div className="card" style={{ padding: "40px", textAlign: "center", background: "linear-gradient(135deg, #101918, #1a2e2b)", color: "#fff" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px", color: "#fff" }}>Ready to Experience XY Hotel?</h2>
          <p style={{ marginBottom: "20px", opacity: 0.8 }}>Book your stay today and enjoy Ethiopian hospitality at its finest.</p>
          <Link href="/hotels" className="btn btn-primary" style={{ fontSize: "16px", padding: "12px 32px" }}>
            Book Your Room
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
