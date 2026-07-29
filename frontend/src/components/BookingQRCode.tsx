"use client";

import QRCode from "react-qr-code";
import { CheckCircle, XCircle, Hotel, Calendar, Users, DollarSign } from "lucide-react";

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
    <div className="card" style={{ textAlign: "center", maxWidth: "340px" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
        <QRCode value={qrValue} size={200} style={{ borderRadius: "8px" }} />
      </div>
      <div style={{ fontSize: "13px", textAlign: "left", background: "var(--bg-secondary, #f5f5f5)", padding: "12px", borderRadius: "8px" }}>
        <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "8px", textAlign: "center" }}>{bookingNumber}</div>
        {hotelName && <div style={{ marginBottom: "4px" }}><Hotel size={12} style={{ display: "inline", marginRight: "4px" }} />{hotelName}</div>}
        {checkIn && <div style={{ marginBottom: "4px" }}><Calendar size={12} style={{ display: "inline", marginRight: "4px" }} />{new Date(checkIn).toLocaleDateString()} - {checkOut ? new Date(checkOut).toLocaleDateString() : ""}</div>}
        {guests && <div style={{ marginBottom: "4px" }}><Users size={12} style={{ display: "inline", marginRight: "4px" }} />{guests} guest(s)</div>}
        {totalAmount && <div style={{ marginBottom: "4px" }}><DollarSign size={12} style={{ display: "inline", marginRight: "4px" }} />${totalAmount.toFixed(2)}</div>}
        <div style={{ marginTop: "8px", textAlign: "center" }}>
          {isConfirmed ? (
            <span className="badge badge-green"><CheckCircle size={12} /> Confirmed</span>
          ) : (
            <span className="badge badge-red"><XCircle size={12} /> {status}</span>
          )}
        </div>
      </div>
    </div>
  );
}
