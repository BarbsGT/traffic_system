"use client";

import { PanelLeftClose, PanelLeft } from "lucide-react";
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
      {/* Brand */}
      <div
        className="flex items-center gap-2.5 px-4 h-full transition-all duration-300"
        style={{ width: collapsed ? "100%" : "auto", justifyContent: collapsed ? "center" : "flex-start" }}
      >
        <div
          className="flex items-center gap-1.5 transition-all duration-300 overflow-hidden whitespace-nowrap"
          style={{
            opacity: collapsed ? 0 : 1,
            width: collapsed ? 0 : "auto",
          }}
        >
          <img src="/ogilvy-logo.png" alt="Ogilvy" style={{ height: 26, width: "auto", borderRadius: 4 }} />
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
