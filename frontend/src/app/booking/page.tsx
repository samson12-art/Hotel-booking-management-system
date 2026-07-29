"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import AppShell from "@/components/AppShell";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { CreditCard, Wallet, Smartphone, Banknote, CheckCircle } from "lucide-react";

export default function BookingPage() {
  const [bookingData, setBookingData] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("CREDIT_CARD");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const data = localStorage.getItem("bookingData");
    if (data) { setBookingData(JSON.parse(data)); }
    else { router.push("/hotels"); }
  }, [router]);

  const applyCoupon = async () => {
    if (!couponCode) return;
    try {
      const { data } = await api.post("/coupons/validate", { code: couponCode, bookingAmount: bookingData.totalAmount });
      setDiscount(data.data.discount);
      toast.success(`Coupon applied! -$${discount.toFixed(2)}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid coupon");
    }
  };

  const handleBooking = async () => {
    if (!bookingData) return;
    setLoading(true);
    try {
      const { data: bookingRes } = await api.post("/bookings", {
        hotelId: bookingData.hotelId, checkIn: bookingData.checkIn, checkOut: bookingData.checkOut,
        guests: bookingData.guests, roomIds: bookingData.roomIds, specialRequests: "", couponCode: couponCode || undefined,
      });
      const bookingId = bookingRes.data.id;
      await api.post("/payments", { bookingId, method: paymentMethod });
      setBookingResult({ ...bookingRes.data, paymentMethod });
      setSuccess(true);
      localStorage.removeItem("bookingData");
      toast.success("Booking confirmed!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Booking failed");
    } finally { setLoading(false); }
  };

  if (!bookingData) return null;

  if (success) {
    return (
      <AppShell>
        <div className="topbar"><div className="topbar-left"><h1 className="topbar-title">Booking Confirmed</h1></div></div>
        <div className="card" style={{ maxWidth: "560px", margin: "0 auto", textAlign: "center" }}>
          <CheckCircle size={80} style={{ color: "var(--success)", margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>Booking Confirmed!</h2>
          <p className="color-muted" style={{ marginBottom: "24px" }}>Your booking has been successfully processed.</p>
          <div style={{ background: "var(--bg)", borderRadius: "var(--radius)", padding: "16px", textAlign: "left", marginBottom: "24px" }}>
            <div className="flex justify-between" style={{ marginBottom: "8px" }}><span className="text-sm color-muted">Booking #</span><span className="text-sm" style={{ fontWeight: 600 }}>{bookingResult?.bookingNumber}</span></div>
            <div className="flex justify-between" style={{ marginBottom: "8px" }}><span className="text-sm color-muted">Hotel</span><span className="text-sm" style={{ fontWeight: 600 }}>{bookingData.hotelName}</span></div>
            <div className="flex justify-between" style={{ marginBottom: "8px" }}><span className="text-sm color-muted">Check-in</span><span className="text-sm" style={{ fontWeight: 600 }}>{bookingData.checkIn}</span></div>
            <div className="flex justify-between" style={{ marginBottom: "8px" }}><span className="text-sm color-muted">Check-out</span><span className="text-sm" style={{ fontWeight: 600 }}>{bookingData.checkOut}</span></div>
            <div className="flex justify-between"><span className="text-sm color-muted">Total Paid</span><span className="text-sm" style={{ fontWeight: 700, color: "var(--accent)" }}>${(bookingData.totalAmount - discount).toFixed(2)}</span></div>
          </div>
          <button onClick={() => router.push("/dashboard")} className="btn btn-primary">View My Bookings</button>
        </div>
      </AppShell>
    );
  }

  const nights = Math.ceil((new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) / (1000 * 60 * 60 * 24));
  const total = bookingData.totalAmount - discount;

  return (
    <AppShell>
      <div className="topbar"><div className="topbar-left"><h1 className="topbar-title">Complete Your Booking</h1></div></div>

      <div className="grid-2" style={{ maxWidth: "1000px" }}>
        {/* Booking Summary */}
        <div className="card">
          <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>Booking Summary</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="flex justify-between"><span className="color-muted">Hotel</span><span style={{ fontWeight: 600 }}>{bookingData.hotelName}</span></div>
            <div className="flex justify-between"><span className="color-muted">Check-in</span><span style={{ fontWeight: 600 }}>{bookingData.checkIn}</span></div>
            <div className="flex justify-between"><span className="color-muted">Check-out</span><span style={{ fontWeight: 600 }}>{bookingData.checkOut}</span></div>
            <div className="flex justify-between"><span className="color-muted">Nights</span><span style={{ fontWeight: 600 }}>{nights}</span></div>
            <div className="flex justify-between"><span className="color-muted">Rooms</span><span style={{ fontWeight: 600 }}>{bookingData.roomIds.length}</span></div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }} />
            <div className="flex justify-between" style={{ fontSize: "20px", fontWeight: 800 }}>
              <span>Total</span>
              <span style={{ color: "var(--accent)" }}>${total.toFixed(2)}</span>
            </div>
          </div>
          <div className="form-group" style={{ marginTop: "24px" }}>
            <label className="form-label">Coupon Code</label>
            <div className="flex gap-2">
              <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="form-input" placeholder="Enter coupon" />
              <button onClick={applyCoupon} className="btn btn-secondary" style={{ flexShrink: 0 }}>Apply</button>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="card">
          <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>Payment Method</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { id: "CREDIT_CARD", label: "Credit Card", icon: CreditCard },
              { id: "PAYPAL", label: "PayPal", icon: Wallet },
              { id: "TELEBIRR", label: "Telebirr", icon: Smartphone },
              { id: "CBE_BIRR", label: "CBE Birr", icon: Smartphone },
              { id: "CASH", label: "Cash at Hotel", icon: Banknote },
            ].map(({ id, label, icon: Icon }) => (
              <label key={id} className="flex items-center gap-3" style={{ padding: "12px", border: `1px solid ${paymentMethod === id ? "var(--accent)" : "var(--border)"}`, borderRadius: "var(--radius)", cursor: "pointer", background: paymentMethod === id ? "var(--accent-light)" : "transparent" }}>
                <input type="radio" name="payment" value={id} checked={paymentMethod === id} onChange={(e) => setPaymentMethod(e.target.value)} />
                <Icon size={18} className="color-muted" />
                <span style={{ fontWeight: 600 }}>{label}</span>
              </label>
            ))}
          </div>

          {paymentMethod === "CREDIT_CARD" && (
            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <input type="text" className="form-input" placeholder="Card Number" defaultValue="4242 4242 4242 4242" />
              <div className="grid-2">
                <input type="text" className="form-input" placeholder="MM/YY" defaultValue="12/28" />
                <input type="text" className="form-input" placeholder="CVV" defaultValue="123" />
              </div>
              <input type="text" className="form-input" placeholder="Name on Card" defaultValue={user ? `${user.firstName} ${user.lastName}` : ""} />
            </div>
          )}

          <button onClick={handleBooking} disabled={loading} className="btn btn-primary w-full" style={{ marginTop: "24px" }}>
            {loading ? "Processing..." : `Pay $${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
