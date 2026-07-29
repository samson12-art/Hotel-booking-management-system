"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import AppShell from "@/components/AppShell";
import RoomCard from "@/components/RoomCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import GoogleMap from "@/components/GoogleMap";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { Star, MapPin, Phone, Globe, Wifi, Heart, Share2 } from "lucide-react";

export default function HotelDetailPage({ params }: { params: { id: string } }) {
  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const { data } = await api.get(`/hotels/${params.id}`);
        setHotel(data.data);
      } catch (error) { console.error("Failed to fetch hotel:", error); }
      finally { setLoading(false); }
    };
    fetchHotel();
  }, [params.id]);

  const toggleRoom = (roomId: string) => {
    setSelectedRooms((prev) => prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]);
  };

  const calculateTotal = () => {
    if (!hotel || !checkIn || !checkOut || selectedRooms.length === 0) return 0;
    const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    return hotel.rooms.filter((r: any) => selectedRooms.includes(r.id)).reduce((sum: number, r: any) => sum + r.price * nights, 0);
  };

  const handleBook = () => {
    if (!user) { toast.error("Please login to book"); router.push("/auth/login"); return; }
    if (!checkIn || !checkOut) { toast.error("Please select dates"); return; }
    if (selectedRooms.length === 0) { toast.error("Please select at least one room"); return; }
    const bookingData = { hotelId: hotel.id, checkIn, checkOut, guests: 2, roomIds: selectedRooms, totalAmount: calculateTotal(), hotelName: hotel.name };
    localStorage.setItem("bookingData", JSON.stringify(bookingData));
    router.push("/booking");
  };

  if (loading) return <AppShell><div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}><LoadingSpinner size="lg" /></div></AppShell>;
  if (!hotel) return <AppShell><div className="empty-state"><p>Hotel not found</p></div></AppShell>;

  return (
    <AppShell>
      {/* Image Gallery */}
      <div style={{ height: "384px", background: "var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "24px", position: "relative" }}>
        {hotel.images?.[0] ? (
          <img src={`http://localhost:5000${hotel.images[0].url}`} alt={hotel.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : hotel.primaryImage ? (
          <img src={`http://localhost:5000${hotel.primaryImage.url}`} alt={hotel.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", background: "linear-gradient(135deg, #101918, #136f63)", color: "#fff" }}>
            XY Hotel
          </div>
        )}
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: "2fr 1fr", gap: "32px" }}>
        {/* Left: Hotel Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>{hotel.name}</h1>
            <div className="flex items-center gap-4" style={{ flexWrap: "wrap", marginBottom: "8px" }}>
              <div className="flex items-center gap-1">
                {Array.from({ length: hotel.starRating }).map((_, i) => <Star key={i} size={14} style={{ fill: "#fbbf24", color: "#fbbf24" }} />)}
              </div>
              <div className="flex items-center color-muted"><MapPin size={14} style={{ marginRight: "4px" }} />{hotel.address}</div>
              <div className="flex items-center gap-1"><Star size={14} style={{ fill: "#fbbf24", color: "#fbbf24" }} /><span style={{ fontWeight: 600 }}>{hotel.averageRating?.toFixed(1) || "New"}</span><span className="color-muted">({hotel._count?.reviews || 0} reviews)</span></div>
            </div>
            <div className="flex gap-4 text-sm color-muted">
              <span className="flex items-center gap-1"><Phone size={14} />{hotel.phoneNumber}</span>
              <span className="flex items-center gap-1"><Globe size={14} />{hotel.website || "xyhotel.com"}</span>
            </div>
          </div>

            <div className="card">
              <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>About</h2>
              <p className="color-muted" style={{ lineHeight: 1.7 }}>{hotel.description}</p>
            </div>

            {hotel.latitude && hotel.longitude && (
              <div className="card">
                <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>Location</h2>
                <GoogleMap latitude={hotel.latitude} longitude={hotel.longitude} />
              </div>
            )}

            {hotel.amenities?.length > 0 && (
            <div className="card">
              <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>Amenities</h2>
              <div className="grid-3">
                {hotel.amenities.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-2 color-muted">
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Wifi size={16} style={{ color: "var(--accent)" }} />
                    </div>
                    <span>{a.name || a.amenity?.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hotel.policies?.length > 0 && (
            <div className="card">
              <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>Policies</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {hotel.policies.map((p: any) => (
                  <div key={p.id}>
                    <h3 style={{ fontWeight: 600, marginBottom: "4px" }}>{p.title}</h3>
                    <p className="text-sm color-muted">{p.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>Available Rooms</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {hotel.rooms?.map((room: any) => (
                <RoomCard key={room.id} room={room} selected={selectedRooms.includes(room.id)} onSelect={toggleRoom} />
              ))}
              {(!hotel.rooms || hotel.rooms.length === 0) && <p className="color-muted">No rooms available</p>}
            </div>
          </div>

          {hotel.reviews?.length > 0 && (
            <div className="card">
              <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>Reviews</h2>
              {hotel.reviews.map((review: any) => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="review-avatar">{review.user?.firstName?.[0]}{review.user?.lastName?.[0]}</div>
                    <div>
                      <div className="review-name">{review.user?.firstName} {review.user?.lastName}</div>
                      <div className="review-stars">
                        {Array.from({ length: review.rating }).map((_, i) => <Star key={i} size={12} style={{ fill: "#fbbf24", color: "#fbbf24" }} />)}
                      </div>
                    </div>
                  </div>
                  <p className="review-text">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Booking Sidebar */}
        <div>
          <div className="card" style={{ position: "sticky", top: "24px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>Book a Room</h3>
            <div className="form-group">
              <label className="form-label">Check-in</label>
              <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="form-input" min={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="form-group">
              <label className="form-label">Check-out</label>
              <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="form-input" min={checkIn || new Date().toISOString().split("T")[0]} />
            </div>

            {selectedRooms.length > 0 && (
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "16px" }}>
                <p className="text-sm color-muted">{selectedRooms.length} room{selectedRooms.length > 1 ? "s" : ""} selected</p>
                {checkIn && checkOut && (
                  <>
                    <p className="text-sm color-muted">{Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))} night(s)</p>
                    <div className="flex justify-between" style={{ marginTop: "8px", fontSize: "20px", fontWeight: 800 }}>
                      <span>Total:</span>
                      <span style={{ color: "var(--accent)" }}>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            <button onClick={handleBook} className="btn btn-primary w-full" style={{ marginTop: "16px" }} disabled={selectedRooms.length === 0}>Book Now</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
