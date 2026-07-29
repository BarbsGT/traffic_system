"use client";

import { Calendar, Pause, Edit3, Copy, MoreHorizontal } from "lucide-react";
import { SparklineMetric } from "./SparklineMetric";

interface TrafficRowProps {
  campaign: string;
  platform: "meta" | "google" | "tiktok";
  campaignId: string;
  traffickerName: string;
  traffickerAvatar?: string;
  startDate: string;
  endDate: string;
  priority: "alta" | "media" | "baja";
  status: "activo" | "pausado" | "revision" | "finalizado";
  roas: number;
  cpa: number;
  trend: number[];
}

const platformIcons: Record<string, string> = {
  meta: "M",
  google: "G",
  tiktok: "T",
};

const platformColors: Record<string, string> = {
  meta: "#1877F2",
  google: "#4285F4",
  tiktok: "#000000",
};

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  activo: { label: "Activo", bg: "var(--tag-green-bg)", text: "var(--tag-green-text)" },
  pausado: { label: "Pausado", bg: "var(--tag-amber-bg)", text: "var(--tag-amber-text)" },
  revision: { label: "En Revisión", bg: "var(--tag-blue-bg)", text: "var(--tag-blue-text)" },
  finalizado: { label: "Finalizado", bg: "var(--tag-rose-bg)", text: "var(--tag-rose-text)" },
};

const priorityColors: Record<string, string> = {
  alta: "var(--accent-rose)",
  media: "var(--accent-amber)",
  baja: "var(--accent-green)",
};

export function TrafficDataRow({ campaign, platform, campaignId, traffickerName, startDate, endDate, priority, status, roas, cpa, trend }: TrafficRowProps) {
  const st = statusConfig[status];
  const pc = platformColors[platform];
  const pi = platformIcons[platform];

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 text-sm transition-all group"
      style={{ background: "var(--card-bg)", color: "var(--text-primary)" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--table-row-hover)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "var(--card-bg)"; }}
    >
      <div className="flex items-center gap-3 flex-[2] min-w-0">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: pc }}
        >
          {pi}
        </div>
        <div className="min-w-0">
          <div className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>{campaign}</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>{campaignId}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
          style={{ background: "var(--accordion-bg)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
        >
          {traffickerName.charAt(0).toUpperCase()}
        </div>
        <span className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>{traffickerName}</span>
      </div>

      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <Calendar size={12} style={{ color: "var(--text-muted)" }} />
        <span className="text-xs whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>
          {startDate} - {endDate}
        </span>
      </div>

      <div className="flex items-center justify-center flex-[0.5]">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: priorityColors[priority] }}
          title={priority}
        />
      </div>

      <div className="flex-1 min-w-0">
        <span
          className="inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
          style={{ background: st.bg, color: st.text }}
        >
          {st.label}
        </span>
      </div>

      <div className="flex items-center gap-4 flex-[1.5] min-w-0">
        <div className="text-right">
          <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{roas.toFixed(2)}</div>
          <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>ROAS</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>${cpa.toFixed(2)}</div>
          <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>CPA</div>
        </div>
        <SparklineMetric data={trend} width={48} height={20} />
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button className="p-1.5 rounded-md transition-all hover:opacity-70" style={{ color: "var(--text-muted)" }} title="Pausar">
          <Pause size={14} />
        </button>
        <button className="p-1.5 rounded-md transition-all hover:opacity-70" style={{ color: "var(--text-muted)" }} title="Editar">
          <Edit3 size={14} />
        </button>
        <button className="p-1.5 rounded-md transition-all hover:opacity-70" style={{ color: "var(--text-muted)" }} title="Duplicar">
          <Copy size={14} />
        </button>
        <button className="p-1.5 rounded-md transition-all hover:opacity-70" style={{ color: "var(--text-muted)" }}>
          <MoreHorizontal size={14} />
        </button>
      </div>
    </div>
  );
}
