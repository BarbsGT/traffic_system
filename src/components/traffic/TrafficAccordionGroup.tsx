"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface AccordionGroupProps {
  title: string;
  count: number;
  statusColor: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function TrafficAccordionGroup({ title, count, statusColor, children, defaultOpen = true }: AccordionGroupProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl overflow-hidden animate-fadeIn" style={{ border: "1px solid var(--border)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold transition-all"
        style={{ background: "var(--accordion-bg)", color: "var(--text-primary)" }}
      >
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: statusColor }} />
        <span>{title}</span>
        <span
          className="ml-1 px-1.5 py-0.5 rounded text-xs font-medium"
          style={{ background: "var(--card-bg)", color: "var(--text-secondary)" }}
        >
          {count}
        </span>
        <span className="ml-auto" style={{ color: "var(--text-muted)" }}>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </button>
      {open && <div className="divide-y" style={{ borderTop: "1px solid var(--border)" }}>{children}</div>}
    </div>
  );
}
