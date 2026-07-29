"use client";

import { Bed, Users, Bath, Check, X } from "lucide-react";

interface RoomCardProps {
  room: {
    id: string;
    roomNumber: string;
    type: string;
    capacity: number;
    beds: number;
    bathroom: string;
    price: number;
    status?: string;
    description?: string;
    images?: { url: string }[];
    amenities?: { name: string; icon: string }[] | { amenity: { name: string; icon: string } }[];
  };
  hotelId?: string;
  selected?: boolean;
  onSelect?: (roomId: string) => void;
}

const typeColors: Record<string, string> = {
  STANDARD: "#6b7280",
  DELUXE: "#136f63",
  SUITE: "#d97706",
  FAMILY: "#2563eb",
  EXECUTIVE: "#7c3aed",
};

export default function RoomCard({ room, hotelId, selected, onSelect }: RoomCardProps) {
  const isAvailable = room.status === "AVAILABLE" || !room.status;
  const typeColor = typeColors[room.type] || "#6b7280";

  return (
    <div
      className={`room-card ${selected ? "selected" : ""} ${!isAvailable ? "unavailable" : ""}`}
      onClick={() => isAvailable && onSelect?.(room.id)}
      style={!isAvailable ? { opacity: 0.6, pointerEvents: "none" } : undefined}
    >
      <div className="room-card-image">
        {room.images?.[0] ? (
          <img src={`http://localhost:5000${room.images[0].url}`} alt={`Room ${room.roomNumber}`} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", background: "var(--bg-secondary)" }}>
            No Image
          </div>
        )}
        <div style={{ position: "absolute", top: "12px", left: "12px" }}>
          <span style={{ background: typeColor, color: "#fff", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase" }}>
            {room.type}
          </span>
        </div>
        {room.status && room.status !== "AVAILABLE" && (
          <div style={{ position: "absolute", top: "12px", right: "12px" }}>
            <span style={{ background: "#ef4444", color: "#fff", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600 }}>
              {room.status}
            </span>
          </div>
        )}
      </div>

      <div className="room-card-content">
        <div className="room-card-header">
          <div>
            <div className="room-card-type">Room {room.roomNumber}</div>
            {room.description && <p className="text-sm color-muted" style={{ marginTop: "4px" }}>{room.description}</p>}
          </div>
          <div className="room-card-price">${room.price}<span className="text-sm color-muted" style={{ fontWeight: 400 }}> / night</span></div>
        </div>

        <div className="room-card-features">
          <span><Users size={14} /> {room.capacity} guests</span>
          <span><Bed size={14} /> {room.beds} bed{room.beds > 1 ? "s" : ""}</span>
          <span><Bath size={14} /> {room.bathroom}</span>
        </div>

        {room.amenities && room.amenities.length > 0 && (
          <div className="room-card-tags">
            {room.amenities.slice(0, 4).map((a: any, i: number) => (
              <span key={i} className="room-card-tag">{a.name || a.amenity?.name}</span>
            ))}
            {room.amenities.length > 4 && <span className="room-card-tag">+{room.amenities.length - 4} more</span>}
          </div>
        )}

        {isAvailable && !onSelect && (
          <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
            <a href={`/hotels/${hotelId || ""}`} className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: "center" }}>
              Book Now
            </a>
          </div>
        )}

        {isAvailable && onSelect && (
          <div style={{ marginTop: "12px", textAlign: "center" }}>
            {selected ? (
              <span className="flex items-center justify-center gap-1" style={{ color: "var(--accent)", fontWeight: 600, fontSize: "13px" }}>
                <Check size={14} /> Selected
              </span>
            ) : (
              <span className="text-sm color-muted">Click to select this room</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
