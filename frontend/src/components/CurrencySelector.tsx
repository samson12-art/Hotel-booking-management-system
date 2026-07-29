"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number;
}

export default function CurrencySelector() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selected, setSelected] = useState("USD");

  useEffect(() => {
    const saved = localStorage.getItem("currency");
    if (saved) setSelected(saved);

    const fetchCurrencies = async () => {
      try {
        const { data } = await api.get("/currencies");
        setCurrencies(data.data || []);
      } catch {
        // silently fail
      }
    };
    fetchCurrencies();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelected(code);
    localStorage.setItem("currency", code);
    window.dispatchEvent(new CustomEvent("currency-change", { detail: code }));
  };

  if (currencies.length === 0) return null;

  return (
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
      {currencies.map((c) => (
        <option key={c.code} value={c.code}>
          {c.symbol} {c.code}
        </option>
      ))}
    </select>
  );
}
