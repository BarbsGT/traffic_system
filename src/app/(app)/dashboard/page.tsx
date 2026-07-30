"use client";

import { ExecutiveDashboard } from "@/components/ExecutiveDashboard";

export default function DashboardPage() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
      <ExecutiveDashboard />
    </div>
  );
}
