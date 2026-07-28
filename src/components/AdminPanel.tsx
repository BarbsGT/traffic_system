"use client";

import { GlassCard } from "@/components/ui/GlassCard";

export function AdminPanel() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Panel de Administración</h1>
      <GlassCard className="p-6">
        <p style={{ color: "var(--text-secondary)" }}>Panel de administración del sistema.</p>
      </GlassCard>
    </div>
  );
}
