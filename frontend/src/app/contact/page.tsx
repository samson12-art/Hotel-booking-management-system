"use client";

import { useState } from "react";
import api from "@/lib/api";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/contacts", form);
      toast.success("Message sent successfully!");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Contact Us</h1>
          <p className="topbar-subtitle">We&apos;d love to hear from you</p>
        </div>
      </div>

      <div className="grid-2" style={{ maxWidth: "1000px" }}>
        <div className="card">
          <h2 className="card-title mb-4">Get in Touch</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input name="name" value={form.name} onChange={handleChange} className="form-input" placeholder="Your name" required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="form-input" placeholder="your@email.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} className="form-input" placeholder="+251 911 234 567" />
            </div>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input name="subject" value={form.subject} onChange={handleChange} className="form-input" placeholder="How can we help?" required />
            </div>
            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea name="message" value={form.message} onChange={handleChange} className="form-input" placeholder="Your message..." required />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              <Send size={16} /> {loading ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>

        <div>
          <div className="card mb-6">
            <h2 className="card-title mb-4">Contact Information</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="flex items-center gap-3">
                <div className="stat-card-icon teal"><MapPin size={18} /></div>
                <div>
                  <div style={{ fontWeight: 600 }}>Address</div>
                  <div className="color-muted text-sm">Bole Road, Addis Ababa, Ethiopia</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="stat-card-icon teal"><Phone size={18} /></div>
                <div>
                  <div style={{ fontWeight: 600 }}>Phone</div>
                  <div className="color-muted text-sm">+251 11 234 5678</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="stat-card-icon teal"><Mail size={18} /></div>
                <div>
                  <div style={{ fontWeight: 600 }}>Email</div>
                  <div className="color-muted text-sm">info@xyhotel.com</div>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div style={{ width: "100%", height: "240px", borderRadius: "var(--radius)", overflow: "hidden" }}>
              <iframe
                src="https://maps.google.com/maps?q=9.0227,38.7468&z=15&output=embed"
                width="100%" height="100%" style={{ border: 0 }} loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
