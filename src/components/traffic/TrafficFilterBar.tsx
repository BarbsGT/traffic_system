"use client";

import { Search, Plus, Filter, ChevronDown } from "lucide-react";

export function TrafficFilterBar() {
  return (
    <div className="flex items-center gap-3 py-3 animate-fadeIn">
      <div className="relative flex-1 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
        <input
          type="text"
          placeholder="Buscar campaña...  Ctrl+K"
          className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none transition-all"
          style={{
            background: "var(--input-bg)",
            border: "1px solid var(--input-border)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          <Filter size={14} />
          <span>Grupo: Estado del Tráfico</span>
          <ChevronDown size={12} />
        </button>

        <select
          className="px-3 py-2 rounded-lg text-sm outline-none transition-all"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          <option value="">Todos los Traffickers</option>
          <option value="1">Usuario 1</option>
          <option value="2">Usuario 2</option>
        </select>
      </div>

      <button
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all ml-auto"
        style={{ background: "var(--accent-cyan)" }}
      >
        <Plus size={16} />
        <span>Agregar Campaña</span>
      </button>
    </div>
  );
}
