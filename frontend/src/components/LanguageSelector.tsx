"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Globe } from "lucide-react";

export default function LanguageSelector() {
  const [locales, setLocales] = useState<string[]>([]);
  const [selected, setSelected] = useState("en");

  useEffect(() => {
    const saved = localStorage.getItem("language");
    if (saved) setSelected(saved);

    const fetchLocales = async () => {
      try {
        const { data } = await api.get("/translations/locales");
        setLocales(data.data || []);
      } catch {
        // silently fail
      }
    };
    fetchLocales();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setSelected(lang);
    localStorage.setItem("language", lang);
    window.dispatchEvent(new CustomEvent("language-change", { detail: lang }));
  };

  if (locales.length === 0) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <Globe size={14} style={{ color: "var(--muted)" }} />
      <select
        value={selected}
        onChange={handleChange}
        style={{
          padding: "4px 8px",
          borderRadius: "6px",
          border: "1px solid var(--border)",
          background: "var(--surface)",
          color: "var(--text)",
          fontSize: "13px",
          cursor: "pointer",
          minHeight: "32px",
        }}
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {loc.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
