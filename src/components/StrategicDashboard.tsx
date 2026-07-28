"use client";

import { useState } from "react";
import { ExecutiveDashboard } from "@/components/ExecutiveDashboard";
import { TrafficMatrix } from "@/components/TrafficMatrix";
import { GanttTimeline } from "@/components/GanttTimeline";

type Tab = "ejecutivo" | "matriz" | "gantt";

export function StrategicDashboard() {
  const [tab, setTab] = useState<Tab>("ejecutivo");

  const tabs: { key: Tab; label: string }[] = [
    { key: "ejecutivo", label: "Dashboard Ejecutivo" },
    { key: "matriz", label: "Matriz de Tráfico" },
    { key: "gantt", label: "Gantt" },
  ];

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Panel Estratégico</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t.key ? "var(--accent-cyan)" : "var(--glass-bg)",
              color: tab === t.key ? "#fff" : "var(--text-secondary)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "ejecutivo" && <ExecutiveDashboard />}
      {tab === "matriz" && <TrafficMatrix />}
      {tab === "gantt" && <GanttTimeline />}
    </div>
  );
}
