"use client";

import { useState } from "react";
import { ExecutiveDashboard } from "@/components/ExecutiveDashboard";
import { HierarchyDashboard } from "@/components/HierarchyDashboard";
import { GlassCard } from "@/components/ui/GlassCard";

type Tab = "ejecutivo" | "operacional" | "capacidad" | "cronograma" | "proyectos";

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("ejecutivo");

  const tabs: { key: Tab; label: string }[] = [
    { key: "ejecutivo", label: "Ejecutivo" },
    { key: "operacional", label: "Operacional" },
    { key: "capacidad", label: "Capacidad" },
    { key: "cronograma", label: "Cronograma" },
    { key: "proyectos", label: "Proyectos" },
  ];

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Dashboard</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t.key ? "var(--accent-cyan)" : "var(--glass-bg)",
              color: tab === t.key ? "#fff" : "var(--text-secondary)",
              border: tab === t.key ? "none" : "1px solid var(--card-border)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "ejecutivo" && <ExecutiveDashboard />}
      {tab === "operacional" && <HierarchyDashboard />}
      {tab === "capacidad" && <CapacityTab />}
      {tab === "cronograma" && <CronogramaTab />}
      {tab === "proyectos" && <ProyectosTab />}
    </div>
  );
}

function CapacityTab() {
  return (
    <GlassCard className="p-6">
      <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Capacidad del Equipo</h2>
      <p style={{ color: "var(--text-secondary)" }}>Gráfico de capacidad próximo.</p>
    </GlassCard>
  );
}

function CronogramaTab() {
  return (
    <GlassCard className="p-6">
      <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Cronograma</h2>
      <p style={{ color: "var(--text-secondary)" }}>Vista de cronograma próximo.</p>
    </GlassCard>
  );
}

function ProyectosTab() {
  return (
    <GlassCard className="p-6">
      <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Proyectos</h2>
      <p style={{ color: "var(--text-secondary)" }}>Lista de proyectos próximo.</p>
    </GlassCard>
  );
}
