"use client";

import { Grid3X3, PanelLeftClose, PanelLeft } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface SidebarHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function SidebarHeader({ collapsed, onToggle }: SidebarHeaderProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className="flex items-center h-14 border-b shrink-0 overflow-hidden"
      style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "var(--border)" }}
    >
      {/* Isotipo + Brand */}
      <div
        className="flex items-center gap-2.5 px-4 h-full transition-all duration-300"
        style={{ width: collapsed ? "100%" : "auto", justifyContent: collapsed ? "center" : "flex-start" }}
      >
        {/* Isotipo */}
        <div
          className="relative flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-all duration-200"
          style={{
            background: isDark
              ? "linear-gradient(135deg, rgba(56,189,248,0.15), rgba(96,165,250,0.15))"
              : "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(59,130,246,0.12))",
            border: `1px solid ${isDark ? "rgba(56,189,248,0.25)" : "rgba(14,165,233,0.2)"}`,
            boxShadow: isDark
              ? "0 0 14px rgba(56,189,248,0.18), inset 0 1px 0 rgba(255,255,255,0.05)"
              : "0 0 12px rgba(14,165,233,0.12), inset 0 1px 0 rgba(255,255,255,0.6)",
          }}
        >
          <Grid3X3
            size={16}
            style={{
              color: isDark ? "#38BDF8" : "#0EA5E9",
              filter: isDark ? "drop-shadow(0 0 4px rgba(56,189,248,0.4))" : "none",
            }}
          />
        </div>

        {/* Brand Text */}
        <div
          className="flex items-center gap-1.5 transition-all duration-300 overflow-hidden whitespace-nowrap"
          style={{
            opacity: collapsed ? 0 : 1,
            width: collapsed ? 0 : "auto",
          }}
        >
          <span
            className="text-sm font-extrabold tracking-tight"
            style={{ color: isDark ? "#F1F5F9" : "#0F172A" }}
          >
            AGENCY
          </span>
          <span
            className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
          >
            GRID
          </span>
          <span
            className="text-[9px] font-bold px-1 py-0.5 rounded ml-0.5"
            style={{
              background: isDark ? "rgba(56,189,248,0.15)" : "rgba(14,165,233,0.1)",
              color: isDark ? "#38BDF8" : "#0EA5E9",
              border: `1px solid ${isDark ? "rgba(56,189,248,0.2)" : "rgba(14,165,233,0.15)"}`,
            }}
          >
            PRO
          </span>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center w-7 h-7 rounded-lg mr-3 transition-all duration-200 hover:scale-105 shrink-0"
        style={{
          marginLeft: collapsed ? 0 : "auto",
          background: "transparent",
          color: isDark ? "rgba(255,255,255,0.45)" : "var(--text-muted)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";
          e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.8)" : "var(--text-primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.45)" : "var(--text-muted)";
        }}
        title={collapsed ? "Expandir men\u00fa" : "Plegar men\u00fa (\u2318B)"}
      >
        {collapsed ? <PanelLeft size={15} /> : <PanelLeftClose size={15} />}
      </button>
    </div>
  );
}
