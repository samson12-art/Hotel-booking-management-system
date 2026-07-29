"use client";

import QRCode from "react-qr-code";
import { CheckCircle, XCircle } from "lucide-react";

interface BookingQRCodeProps {
  bookingNumber: string;
  status: string;
}

export default function BookingQRCode({ bookingNumber, status }: BookingQRCodeProps) {
  const isConfirmed = status === "CONFIRMED" || status === "CHECKED_IN";

  return (
    <div className="card" style={{ textAlign: "center", maxWidth: "320px" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
        <QRCode value={bookingNumber} size={180} style={{ borderRadius: "8px" }} />
      </div>
      <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "4px" }}>
        {bookingNumber}
      </div>
      <div className="flex items-center justify-center gap-2">
        {isConfirmed ? (
          <span className="badge badge-green"><CheckCircle size={12} /> Confirmed</span>
        ) : (
          <span className="badge badge-red"><XCircle size={12} /> {status}</span>
        )}
      </div>
    </div>
  );
}
