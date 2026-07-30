"use client";

import { useMemo } from "react";
import {
  BarChart3, Users, Clock, AlertTriangle, TrendingUp, Activity,
} from "lucide-react";

interface TaskRow {
  agencyId: string;
  agencyName: string;
  accountId: string;
  accountName: string;
  projectId: string;
  projectName: string;
  assigneeId: string;
  assigneeName: string;
  status: string;
  estimatedHours: number;
  dueDate: string;
}

interface CollaboratorLoad {
  id: string;
  name: string;
  totalTasks: number;
  totalHours: number;
  blockedTasks: number;
  urgentTasks: number;
}

interface AnalyticsSidebarProps {
  rows: TaskRow[];
  collapsed: boolean;
  onToggle: () => void;
}

function daysUntil(d: string): number {
  if (!d) return Infinity;
  return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function AnalyticsSidebar({ rows, collapsed, onToggle }: AnalyticsSidebarProps) {
  const stats = useMemo(() => {
    const total = rows.length;
    const byStatus: Record<string, number> = {};
    let totalHours = 0;
    let blocked = 0;
    let urgent = 0;
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const assigneeMap = new Map<string, CollaboratorLoad>();

    for (const r of rows) {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      totalHours += r.estimatedHours;
      if (r.status === "BLOCKED") blocked++;
      if (r.dueDate) {
        const d = new Date(r.dueDate);
        if (d <= in48h && d >= now && r.status !== "COMPLETED") urgent++;
      }

      if (r.assigneeId) {
        if (!assigneeMap.has(r.assigneeId)) {
          assigneeMap.set(r.assigneeId, {
            id: r.assigneeId,
            name: r.assigneeName,
            totalTasks: 0,
            totalHours: 0,
            blockedTasks: 0,
            urgentTasks: 0,
          });
        }
        const a = assigneeMap.get(r.assigneeId)!;
        a.totalTasks++;
        a.totalHours += r.estimatedHours;
        if (r.status === "BLOCKED") a.blockedTasks++;
        if (r.dueDate) {
          const d = new Date(r.dueDate);
          if (d <= in48h && d >= now && r.status !== "COMPLETED") a.urgentTasks++;
        }
      }
    }

    const completed = byStatus["COMPLETED"] || 0;
    const efficiency = total > 0 ? Math.round((completed / total) * 100) : 0;

    const collaborators = Array.from(assigneeMap.values())
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 8);

    const agencyStats = new Map<string, { name: string; tasks: number; hours: number }>();
    for (const r of rows) {
      if (!r.agencyId) continue;
      if (!agencyStats.has(r.agencyId)) {
        agencyStats.set(r.agencyId, { name: r.agencyName, tasks: 0, hours: 0 });
      }
      const s = agencyStats.get(r.agencyId)!;
      s.tasks++;
      s.hours += r.estimatedHours;
    }

    return { total, byStatus, totalHours, blocked, urgent, efficiency, collaborators, agencyStats };
  }, [rows]);

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="flex flex-col items-center gap-2 p-2 rounded-xl transition-all hover:shadow-md"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border)", minWidth: 48 }}
      >
        <BarChart3 size={18} style={{ color: "var(--accent-cyan)" }} />
        <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>Stats</span>
      </button>
    );
  }

  const statusColors: Record<string, string> = {
    PENDING: "var(--tag-amber-bg)",
    IN_PROGRESS: "var(--tag-blue-bg)",
    REVIEW: "var(--tag-purple-bg)",
    COMPLETED: "var(--tag-green-bg)",
    BLOCKED: "var(--tag-rose-bg)",
  };

  const statusLabels: Record<string, string> = {
    PENDING: "Pendiente",
    IN_PROGRESS: "En Progreso",
    REVIEW: "Revisión",
    COMPLETED: "Completado",
    BLOCKED: "Bloqueado",
  };

  return (
    <div
      className="rounded-xl overflow-hidden animate-fadeIn"
      style={{ background: "var(--card-bg)", border: "1px solid var(--border)", width: 280 }}
    >
      <div className="flex items-center justify-between px-3 py-2.5" style={{ background: "var(--accordion-bg)" }}>
        <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
          <BarChart3 size={13} />
          Analíticas
        </div>
        <button onClick={onToggle} className="text-xs" style={{ color: "var(--text-muted)" }}>×</button>
      </div>

      <div className="p-3 space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-2">
          <StatCard icon={<Activity size={14} />} label="Tareas" value={stats.total} color="var(--accent-cyan)" />
          <StatCard icon={<Clock size={14} />} label="Horas" value={`${stats.totalHours}h`} color="var(--accent-purple)" />
          <StatCard icon={<TrendingUp size={14} />} label="Eficiencia" value={`${stats.efficiency}%`} color={stats.efficiency >= 70 ? "var(--accent-green)" : "var(--accent-amber)"} />
          <StatCard icon={<AlertTriangle size={14} />} label="Urgentes" value={stats.urgent} color={stats.urgent > 0 ? "var(--accent-rose)" : "var(--accent-green)"} />
        </div>

        {/* Status Breakdown */}
        <div className="space-y-1.5">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Por Estado
          </h4>
          {Object.entries(stats.byStatus).sort(([,a], [,b]) => b - a).map(([status, count]) => (
            <div key={status} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: statusColors[status] || "var(--divider)" }} />
              <span className="text-xs flex-1" style={{ color: "var(--text-secondary)" }}>{statusLabels[status] || status}</span>
              <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{count}</span>
            </div>
          ))}
        </div>

        {/* Agency Breakdown */}
        {stats.agencyStats.size > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Por Agencia
            </h4>
            {Array.from(stats.agencyStats.values()).map((a) => (
              <div key={a.name} className="flex items-center gap-2">
                <span className="text-xs flex-1 truncate" style={{ color: "var(--text-secondary)" }}>{a.name}</span>
                <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>{a.tasks}t · {a.hours}h</span>
              </div>
            ))}
          </div>
        )}

        {/* Workload */}
        {stats.collaborators.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              <Users size={11} />
              Carga de Trabajo
            </h4>
            {stats.collaborators.map((c) => {
              const hasIssues = c.blockedTasks > 0 || c.urgentTasks > 0;
              return (
                <div key={c.id} className="flex items-center gap-2 py-1">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium shrink-0"
                    style={{
                      background: hasIssues ? "rgba(244,63,94,0.1)" : "var(--divider)",
                      color: hasIssues ? "var(--accent-rose)" : "var(--text-muted)",
                    }}
                  >
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{c.name}</div>
                    <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {c.totalTasks}t · {c.totalHours}h
                      {c.blockedTasks > 0 && <span style={{ color: "var(--accent-rose)" }}> · {c.blockedTasks} blocked</span>}
                      {c.urgentTasks > 0 && <span style={{ color: "var(--accent-amber)" }}> · {c.urgentTasks} urg</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Blocked */}
        {stats.blocked > 0 && (
          <div
            className="p-2.5 rounded-lg"
            style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.15)" }}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "var(--accent-rose)" }}>
              <AlertTriangle size={11} />
              {stats.blocked} tarea{stats.blocked !== 1 ? "s" : ""} bloqueada{stats.blocked !== 1 ? "s" : ""}
            </div>
            <p className="text-[10px] mt-1" style={{ color: "var(--text-secondary)" }}>
              Requieren atención inmediata
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div
      className="p-2 rounded-lg"
      style={{ background: "var(--accordion-bg)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-1.5 mb-1" style={{ color }}>
        {icon}
        <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
      </div>
      <div className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{value}</div>
    </div>
  );
}
