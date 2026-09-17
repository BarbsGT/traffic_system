"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { isProjectOverdue } from "@/utils/taskAlerts";
import { formatDateDDMMYYYY } from "@/lib/dates";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  Legend, CartesianGrid,
} from "recharts";

interface UARow {
  id: string;
  account_id: string;
  client_owner: string;
  area: string;
  project_name: string;
  tier: string;
  budget: number;
  brief_date: string;
  resp_bt: string;
  end_date: string;
  working_days: number;
  launch_date: string;
  presentation_date: string;
  creative_status: string;
  status_btlive: string;
  status_migrante: string;
  delivered_at?: string | null;
}

interface SupabaseProjectRow {
  id: string;
  name: string;
  account_id: string;
  type?: string;
  [key: string]: unknown;
}

const STATUS_COLORS: Record<string, string> = {
  Ajustes: "var(--accent-rose)",
  "In Progress": "var(--accent-rose)",
  "To do": "var(--accent-rose)",
  "Review": "var(--accent-rose)",
};

const TIER_ORDER = ["Gold", "Silver", "Bronze"];
const TIER_COLORS = ["var(--accent-amber)", "var(--accent-cyan)", "var(--accent-purple)"];

interface Props {
  accountId: string;
  accountName: string;
}

export function AccountExecutiveDashboard({ accountId, accountName }: Props) {
  const [data, setData] = useState<UARow[]>([]);
  const [allAccountsData, setAllAccountsData] = useState<UARow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accountId) return;
    const supabase = createClient();
    Promise.all([
      supabase.from("projects").select("*").eq("type", "ua_traffic").eq("account_id", accountId),
      supabase.from("projects").select("*").eq("type", "ua_traffic"),
    ]).then(([accountResult, allResult]) => {
      const mapRow = (r: SupabaseProjectRow): UARow => ({
        id: r.id,
        account_id: r.account_id,
        client_owner: String(r.client_owner || ""),
        area: String(r.area || ""),
        project_name: r.name,
        tier: String(r.tier || ""),
        budget: Number(r.budget || 0),
        brief_date: String(r.brief_date || ""),
        resp_bt: String(r.resp_bt || ""),
        end_date: String(r.end_date || ""),
        working_days: Number(r.working_days || 0),
        launch_date: String(r.launch_date || ""),
        presentation_date: String(r.presentation_date || ""),
        creative_status: String(r.creative_status || ""),
        status_btlive: String(r.status_btlive || ""),
        status_migrante: String(r.status_migrante || ""),
        delivered_at: r.delivered_at ? String(r.delivered_at) : null,
      });
      setData((accountResult.data || []).map(mapRow));
      setAllAccountsData((allResult.data || []).map(mapRow));
      setLoading(false);
    });
  }, [accountId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid" style={{ borderColor: "var(--accent-cyan)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const totalBudget = data.reduce((s, r) => s + Number(r.budget || 0), 0);
  const budgetAtRisk = data
    .filter((r) => r.creative_status === "Pending Client" || r.creative_status === "On Hold")
    .reduce((s, r) => s + Number(r.budget || 0), 0);
  const avgWorkingDays = data.length
    ? Math.round(data.reduce((s, r) => s + (r.working_days || 0), 0) / data.length)
    : 0;
  const completedCount = data.filter((r) => r.creative_status === "Approved" || r.creative_status === "Send").length;
  const healthPct = data.length ? Math.round((completedCount / data.length) * 100) : 0;
  const overdueCount = data.filter((r) => isProjectOverdue(r)).length;
  const ajustesCount = data.filter((r) => r.creative_status === "Ajustes").length;

  // Area x Tier stacked bar
  const areaTierData = Array.from(new Set(data.map((r) => r.area))).map((area) => {
    const row: Record<string, string | number> = { area };
    TIER_ORDER.forEach((tier) => {
      row[tier] = data.filter((r) => r.area === area && r.tier === tier).length;
    });
    return row;
  });

  // Status donut
  const statusCount = data.reduce<Record<string, number>>((acc, r) => {
    const s = r.creative_status || "Unknown";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const statusPieData = Object.entries(statusCount).map(([name, value]) => ({ name, value }));
  const statusColors = statusPieData.map((d) => STATUS_COLORS[d.name] || "var(--text-muted)");

  // Workload by resp_bt (horizontal bar)
  const workloadMap = data.reduce<Record<string, number>>((acc, r) => {
    if (r.resp_bt && r.resp_bt !== "-") {
      acc[r.resp_bt] = (acc[r.resp_bt] || 0) + 1;
    }
    return acc;
  }, {});
  const workloadData = Object.entries(workloadMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Budget by tier
  const tierBudgetData = TIER_ORDER.map((tier) => ({
    tier,
    budget: data.filter((r) => r.tier === tier).reduce((s, r) => s + Number(r.budget || 0), 0),
  }));

  // Overdue projects list
  const overdueProjects = data
    .filter((r) => isProjectOverdue(r))
    .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
    .slice(0, 5);

  // Cross-account comparison
  const accountBudgetMap = allAccountsData.reduce<Record<string, { budget: number; count: number }>>((acc, r) => {
    if (!acc[r.account_id]) acc[r.account_id] = { budget: 0, count: 0 };
    acc[r.account_id].budget += Number(r.budget || 0);
    acc[r.account_id].count += 1;
    return acc;
  }, {});

  const areaColor = (area: string) => {
    const colors: Record<string, string> = {
      "Special Projects": "var(--accent-purple)",
      "Social media": "var(--accent-cyan)",
      "Paid media": "var(--accent-amber)",
      "Marketing Ops": "var(--accent-green)",
    };
    return colors[area] || "var(--text-muted)";
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="glass p-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-[#131313] font-bold text-lg"
            style={{ background: "var(--accent-purple)" }}
          >
            {accountName.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{accountName}</h2>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {data.length} proyectos activos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
            style={{
              background: healthPct >= 50 ? "rgba(125,216,125,0.12)" : "rgba(235, 62, 64, 0.12)",
              color: healthPct >= 50 ? "var(--accent-green)" : "var(--accent-rose)",
            }}
          >
            <span>{healthPct >= 50 ? "🟢" : "🟡"}</span>
            {healthPct}% On Time
          </div>
          {overdueCount > 0 && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
              style={{ background: "rgba(235, 62, 64, 0.12)", color: "var(--accent-rose)" }}
            >
              ⚠️ {overdueCount} vencidos
            </div>
          )}
          {ajustesCount > 0 && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
              style={{ background: "rgba(255,209,102,0.12)", color: "var(--accent-amber)" }}
            >
              🔄 {ajustesCount} en ajustes
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass p-5 space-y-2">
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Presupuesto Gestionado
          </span>
          <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            ${totalBudget.toLocaleString("es")}
          </p>
          <div className="flex gap-2 text-xs flex-wrap">
            {TIER_ORDER.map((tier) => {
              const val = data.filter((r) => r.tier === tier).reduce((s, r) => s + Number(r.budget || 0), 0);
              return (
                <span key={tier} style={{ color: "var(--text-secondary)" }}>
                  <span className="font-semibold">{tier}:</span> ${val.toLocaleString("es")}
                </span>
              );
            })}
          </div>
        </div>

        <div className="glass p-5 space-y-2">
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Presupuesto en Riesgo
          </span>
          <p className="text-2xl font-bold" style={{ color: budgetAtRisk > 0 ? "var(--accent-rose)" : "var(--accent-green)" }}>
            ${budgetAtRisk.toLocaleString("es")}
          </p>
          {budgetAtRisk > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: "rgba(235, 62, 64, 0.1)", color: "var(--accent-rose)" }}>
              💡 ${budgetAtRisk.toLocaleString("es")} retenidos en espera de aprobación
            </div>
          )}
        </div>

        <div className="glass p-5 space-y-2">
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Eficiencia Promedio
          </span>
          <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {avgWorkingDays} días
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Días hábiles por proyecto
          </p>
        </div>

        <div className="glass p-5 space-y-2">
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Proyectos por Área
          </span>
          <div className="space-y-1.5">
            {Array.from(new Set(data.map((r) => r.area))).map((area) => {
              const count = data.filter((r) => r.area === area).length;
              const pct = data.length ? Math.round((count / data.length) * 100) : 0;
              return (
                <div key={area} className="flex items-center gap-2 text-xs">
                  <span className="w-24 truncate" style={{ color: "var(--text-secondary)" }}>{area}</span>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--divider)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: areaColor(area) }}
                    />
                  </div>
                  <span className="font-mono w-6 text-right" style={{ color: "var(--text-primary)" }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass p-5 space-y-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Distribución por Área y Tier
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={areaTierData}>
              <XAxis dataKey="area" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--card-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              {TIER_ORDER.map((tier, i) => (
                <Bar
                  key={tier}
                  dataKey={tier}
                  stackId="a"
                  fill={TIER_COLORS[i]}
                  radius={[i === TIER_ORDER.length - 1 ? 4 : 0, i === TIER_ORDER.length - 1 ? 4 : 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass p-5 space-y-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Embudo de Estado Creativo
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusPieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {statusPieData.map((_, i) => (
                  <Cell key={i} fill={statusColors[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--card-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                formatter={(value) => (
                  <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Analytics Row: Workload + Budget by Tier */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass p-5 space-y-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Carga por Responsable
          </h3>
          {workloadData.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Sin datos de responsables</p>
          ) : (
            <div className="space-y-2.5 max-h-[280px] overflow-y-auto">
              {workloadData.map((w, i) => {
                const maxCount = workloadData[0]?.count || 1;
                const pct = (w.count / maxCount) * 100;
                return (
                  <div key={w.name} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-28 truncate text-right" style={{ color: "var(--text-primary)" }}>
                      {w.name}
                    </span>
                    <div className="flex-1 h-5 rounded-lg" style={{ background: "var(--divider)" }}>
                      <div
                        className="h-full rounded-lg flex items-center px-2 text-xs font-medium text-[#131313]"
                        style={{
                          width: `${Math.max(pct, 8)}%`,
                          background: i === 0 ? "var(--accent-rose)" : "var(--accent-cyan)",
                          opacity: 1 - i * 0.08,
                        }}
                      >
                        {w.count} proyectos
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass p-5 space-y-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Presupuesto por Tier
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={tierBudgetData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
              <YAxis dataKey="tier" type="category" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString("es")}`, "Presupuesto"]}
                contentStyle={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--card-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="budget" radius={[0, 4, 4, 0]}>
                {tierBudgetData.map((_, i) => (
                  <Cell key={i} fill={TIER_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {overdueProjects.length > 0 && (
          <div className="glass p-5 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--accent-rose)" }}>
              ⚠️ Proyectos Vencidos ({overdueCount})
            </h3>
            <div className="space-y-2">
              {overdueProjects.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
                  style={{ background: "rgba(235, 62, 64, 0.06)" }}
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-medium block truncate" style={{ color: "var(--text-primary)" }}>{p.project_name}</span>
                    <span style={{ color: "var(--text-muted)" }}>Resp: {p.resp_bt || "—"} · {p.area}</span>
                  </div>
                  <span className="font-mono ml-2 shrink-0" style={{ color: "var(--accent-rose)" }}>
                    Venció: {p.end_date ? formatDateDDMMYYYY(p.end_date) : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="glass p-5 space-y-3">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Proyectos con Ajustes
          </h3>
          {data.filter((r) => r.creative_status === "Ajustes").length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)" }}>
              ✅ Sin proyectos en ajustes
            </p>
          ) : (
            <div className="space-y-2">
              {data
                .filter((r) => r.creative_status === "Ajustes")
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
                    style={{ background: "rgba(255,209,102,0.06)" }}
                  >
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>{p.project_name}</span>
                    <span style={{ color: "var(--text-muted)" }}>{p.client_owner} · {p.resp_bt}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
