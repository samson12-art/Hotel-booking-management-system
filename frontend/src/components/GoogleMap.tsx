"use client";

interface GoogleMapProps {
  latitude: number;
  longitude: number;
  height?: number;
}

export default function GoogleMap({ latitude, longitude, height = 300 }: GoogleMapProps) {
  return (
    <div
      style={{
        width: "100%",
        height,
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        border: "1px solid var(--border)",
      }}
    >
      <iframe
        src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        title="Google Map"
      />
    </div>
  );
}
