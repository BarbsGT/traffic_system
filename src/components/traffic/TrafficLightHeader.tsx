"use client";

type ViewType = "list" | "table";

const views: { key: ViewType; label: string; icon: string }[] = [
  { key: "table", label: "Tabla", icon: "\u2699\uFE0F" },
  { key: "list", label: "Lista", icon: "\uD83D\uDCCB" },
];

export function TrafficLightHeader({ activeView, onViewChange }: { activeView: ViewType; onViewChange: (v: ViewType) => void }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg animate-fadeIn" style={{ background: "var(--accordion-bg)" }}>
      {views.map((v) => {
        const active = activeView === v.key;
        return (
          <button
            key={v.key}
            onClick={() => onViewChange(v.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
            style={{
              background: active ? "var(--card-bg)" : "transparent",
              color: active ? "var(--text-primary)" : "var(--text-secondary)",
              boxShadow: active ? "var(--shadow-sm)" : "none",
            }}
          >
            <span>{v.icon}</span>
            <span>{v.label}</span>
          </button>
        );
      })}
    </div>
  );
}
