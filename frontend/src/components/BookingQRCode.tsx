"use client";

import QRCode from "react-qr-code";
import { CheckCircle, XCircle } from "lucide-react";

interface BookingQRCodeProps {
  bookingNumber: string;
  status: string;
  hotelName?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  totalAmount?: number;
}

export default function BookingQRCode({ bookingNumber, status, hotelName, checkIn, checkOut, guests, totalAmount }: BookingQRCodeProps) {
  const isConfirmed = status === "CONFIRMED" || status === "CHECKED_IN";

  const qrValue = [
    `Hotel: ${hotelName || "N/A"}`,
    `Booking: ${bookingNumber}`,
    `Check-in: ${checkIn ? new Date(checkIn).toLocaleDateString() : "N/A"}`,
    `Check-out: ${checkOut ? new Date(checkOut).toLocaleDateString() : "N/A"}`,
    `Guests: ${guests || 1}`,
    `Amount: $${(totalAmount || 0).toFixed(2)}`,
    `Status: ${status}`,
  ].join("\n");

  return (
    <div style={{ textAlign: "center" }}>
      <QRCode value={qrValue} size={180} style={{ borderRadius: "8px" }} />
      <div style={{ marginTop: "8px" }}>
        {isConfirmed ? (
          <span className="badge badge-green"><CheckCircle size={12} /> Confirmed</span>
        ) : (
          <span className="badge badge-red"><XCircle size={12} /> {status}</span>
        )}
      </div>
    </div>
  );
}
