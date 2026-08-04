interface StatusBadgeProps {
  status: string;
  className?: string;
  tone?: "auto" | "red" | "gray";
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pendiente", color: "var(--accent-amber)", bg: "rgba(245,158,11,0.15)" },
  IN_PROGRESS: { label: "En Progreso", color: "var(--accent-cyan)", bg: "rgba(14,165,233,0.15)" },
  REVIEW: { label: "Revisión", color: "var(--accent-purple)", bg: "rgba(139,92,246,0.15)" },
  COMPLETED: { label: "Completado", color: "var(--accent-green)", bg: "rgba(16,185,129,0.15)" },
  BLOCKED: { label: "Bloqueado", color: "var(--accent-rose)", bg: "rgba(244,63,94,0.15)" },
};

const toneConfig = {
  red: { color: "var(--accent-rose)", bg: "rgba(244,63,94,0.15)" },
  gray: { color: "var(--text-muted)", bg: "var(--card-bg)" },
};

export function StatusBadge({ status, className = "", tone = "auto" }: StatusBadgeProps) {
  const base = statusConfig[status] || { label: status, color: "var(--text-muted)", bg: "var(--card-bg)" };
  const config = tone === "red" ? { ...base, color: toneConfig.red.color, bg: toneConfig.red.bg }
    : tone === "gray" ? { ...base, color: toneConfig.gray.color, bg: toneConfig.gray.bg }
    : base;

  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${className}`}
      style={{ background: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}
