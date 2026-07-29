"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Award, TrendingUp } from "lucide-react";

const TIER_THRESHOLDS: Record<string, number> = {
  BRONZE: 0,
  SILVER: 1000,
  GOLD: 5000,
  PLATINUM: 10000,
};

const TIER_COLORS: Record<string, string> = {
  BRONZE: "#cd7f32",
  SILVER: "#a0aec0",
  GOLD: "#d4af37",
  PLATINUM: "#e5e4e2",
};

const TIER_ICON_COLORS: Record<string, string> = {
  BRONZE: "orange",
  SILVER: "blue",
  GOLD: "yellow",
  PLATINUM: "purple",
};

const TIERS = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];

export default function LoyaltyCard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoyalty = async () => {
      try {
        const { data: res } = await api.get("/loyalty");
        setData(res.data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchLoyalty();
  }, []);

  if (loading) {
    return (
      <div className="card">
        <div className="skeleton" style={{ height: "24px", width: "60%", marginBottom: "12px" }} />
        <div className="skeleton" style={{ height: "40px", width: "40%", marginBottom: "12px" }} />
        <div className="skeleton" style={{ height: "8px", width: "100%" }} />
      </div>
    );
  }

  if (!data) return null;

  const currentTier = data.tier || "BRONZE";
  const currentIndex = TIERS.indexOf(currentTier);
  const nextTier = TIERS[currentIndex + 1];
  const currentThreshold = TIER_THRESHOLDS[currentTier];
  const nextThreshold = nextTier ? TIER_THRESHOLDS[nextTier] : currentThreshold;
  const points = data.points || 0;
  const progress = nextTier ? ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100 : 100;

  return (
    <div className="card" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-dark))", color: "#fff", border: "none" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Award size={24} />
          </div>
          <div>
            <div style={{ fontSize: "12px", opacity: 0.8 }}>Loyalty Program</div>
            <div style={{ fontWeight: 800, fontSize: "20px" }}>{data.tier || "BRONZE"}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "28px", fontWeight: 800 }}>{points.toLocaleString()}</div>
          <div style={{ fontSize: "12px", opacity: 0.8 }}>Points</div>
        </div>
      </div>

      {nextTier && (
        <div>
          <div className="flex items-center justify-between mb-2" style={{ fontSize: "12px", opacity: 0.8 }}>
            <span>{points.toLocaleString()} pts</span>
            <span>{nextTier}: {nextThreshold.toLocaleString()} pts</span>
          </div>
          <div className="progress-bar" style={{ background: "rgba(255,255,255,0.2)" }}>
            <div className="progress-bar-fill" style={{ width: `${Math.min(progress, 100)}%`, background: "#fff" }} />
          </div>
          <div className="flex items-center gap-1 mt-2" style={{ fontSize: "12px", opacity: 0.8 }}>
            <TrendingUp size={12} />
            <span>{Math.round(progress)}% to {nextTier}</span>
          </div>
        </div>
      )}
    </div>
  );
}
