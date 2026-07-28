"use client";

import { GlassCard } from "@/components/ui/GlassCard";

export function FileManager() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Gestor de Archivos</h1>
      <GlassCard className="p-6">
        <p style={{ color: "var(--text-secondary)" }}>Gestor de archivos próximo.</p>
      </GlassCard>
    </div>
  );
}
