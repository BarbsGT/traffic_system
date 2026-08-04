"use client";

import { AccountExecutiveDashboard } from "@/components/AccountExecutiveDashboard";
import { UATrafficMatrix } from "@/components/traffic/UATrafficMatrix";
import { DailyGanttModule } from "@/components/gantt/DailyGanttModule";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { ChevronDown } from "lucide-react";

interface AccountOption {
  id: string;
  name: string;
}

type Tab = "dashboard" | "matrix" | "timeline";

export default function AccountDashboardPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("accounts")
      .select("id, name")
      .order("name")
      .then(({ data }) => {
        const list = (data as AccountOption[]) || [];
        setAccounts(list);
        if (list.length > 0) setSelectedAccountId(list[0].id);
        setLoadingAccounts(false);
      });
  }, []);

  const currentAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-lg text-base font-bold outline-none transition-all"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--card-border)",
                color: "var(--text-primary)",
              }}
              disabled={loadingAccounts}
            >
              {accounts.length === 0 && <option value="">Sin cuentas disponibles</option>}
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-muted)" }}
            />
          </div>
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Dashboard de Gestión de Cuenta
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setTab("dashboard")}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === "dashboard" ? "var(--accent-cyan)" : "var(--glass-bg)",
              color: tab === "dashboard" ? "#fff" : "var(--text-secondary)",
              border: tab === "dashboard" ? "none" : "1px solid var(--card-border)",
            }}
          >
            Dashboard
          </button>
          <button
            onClick={() => setTab("matrix")}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === "matrix" ? "var(--accent-cyan)" : "var(--glass-bg)",
              color: tab === "matrix" ? "#fff" : "var(--text-secondary)",
              border: tab === "matrix" ? "none" : "1px solid var(--card-border)",
            }}
          >
            Matriz de Tráfico
          </button>
          <button
            onClick={() => setTab("timeline")}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === "timeline" ? "var(--accent-cyan)" : "var(--glass-bg)",
              color: tab === "timeline" ? "#fff" : "var(--text-secondary)",
              border: tab === "timeline" ? "none" : "1px solid var(--card-border)",
            }}
          >
            Timeline
          </button>
        </div>
      </div>

      {selectedAccountId && (
        <>
          {tab === "dashboard" && (
            <AccountExecutiveDashboard
              accountId={selectedAccountId}
              accountName={currentAccount?.name || ""}
            />
          )}
          {tab === "matrix" && <UATrafficMatrix accountId={selectedAccountId} disableSearch />}
          {tab === "timeline" && <DailyGanttModule filters={{ accountId: selectedAccountId }} />}
        </>
      )}
    </div>
  );
}
