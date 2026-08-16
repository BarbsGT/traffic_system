"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { loadDashboardData, type DashboardTask, type DashboardProfile, type DashboardProject } from "@/lib/dashboard";
import { localMidnight, startOfTodayLocal, daysFromToday } from "@/lib/dates";
import {
  BarChart3, AlertTriangle, Clock, Users, TrendingUp,
  ChevronDown, AlertCircle, UserCheck, Activity,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

interface Agency { id: string; name: string }
interface Account { id: string; name: string }
interface Project { id: string; name: string; account_id: string; status?: string }

interface CollaboratorLoad {
  id: string;
  name: string;
  totalHours: number;
  capacity: number;
  overloadTasks: { taskId: string; taskTitle: string; suggestedAssignee: string }[];
}

interface AlertTask {
  id: string;
  title: string;
  dueDate: string;
  assigneeName: string;
  assigneeAvatar: string;
  status: string;
  projectName: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#ffd166",
  IN_PROGRESS: "#ffb4aa",
  REVIEW: "#8fa3ff",
  COMPLETED: "#7dd87d",
  BLOCKED: "#ff8a8a",
  BACKLOG: "#8a8a8a",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En Progreso",
  REVIEW: "Revisión",
  COMPLETED: "Completado",
  BLOCKED: "Bloqueado",
  BACKLOG: "Backlog",
};

export function ExecutiveDashboard() {
  const supabase = createClient();
  const fetchSeq = useRef(0);

  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountAgencies, setAccountAgencies] = useState<Record<string, string[]>>({});
  const [projects, setProjects] = useState<Project[]>([]);

  const [selectedAgency, setSelectedAgency] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");

  const [totalActive, setTotalActive] = useState(0);
  const [activeTrend, setActiveTrend] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);
  const [efficiency, setEfficiency] = useState(0);
  const [efficiencyInfo, setEfficiencyInfo] = useState({ onTime: 0, completedWithDue: 0 });
  const [alert48Count, setAlert48Count] = useState(0);

  const [statusData, setStatusData] = useState<{ status: string; count: number }[]>([]);
  const [collaborators, setCollaborators] = useState<CollaboratorLoad[]>([]);
  const [alertTasks, setAlertTasks] = useState<AlertTask[]>([]);

  const fetchData = useCallback(async () => {
    const seq = ++fetchSeq.current;
    const { tasks: allTasks, profiles: allProfiles, projects: allProjects } = await loadDashboardData();

    if (!allTasks || !allProjects || !allProfiles) return;

    // Evita que una respuesta de un fetch anterior (race por cambio rápido de filtros)
    // sobrescriba los KPIs de la petición más reciente.
    if (seq !== fetchSeq.current) return;

    let filteredProjectIds: string[] = [];
    if (selectedProject) {
      filteredProjectIds = [selectedProject];
    } else if (selectedAccount) {
      filteredProjectIds = allTasks
        .filter((t) => t.projects?.account_id === selectedAccount)
        .map((t) => t.project_id);
      filteredProjectIds = [...new Set(filteredProjectIds)];
    } else if (selectedAgency) {
      const agencyAccountIds = accounts.filter((a) => accountAgencies[a.id]?.includes(selectedAgency)).map((a) => a.id);
      filteredProjectIds = allTasks
        .filter((t) => t.projects?.account_id && agencyAccountIds.includes(t.projects.account_id))
        .map((t) => t.project_id);
      filteredProjectIds = [...new Set(filteredProjectIds)];
    }

    const tasks = selectedProject || selectedAccount || selectedAgency
      ? allTasks.filter((t) => filteredProjectIds.includes(t.project_id))
      : allTasks;

    const projectsForCount = selectedProject || selectedAccount || selectedAgency
      ? allProjects.filter((p) => filteredProjectIds.includes(p.id))
      : allProjects;

    const activeProjects = projectsForCount.filter((p) => p.status !== "COMPLETED");
    setTotalActive(activeProjects.length);
    setActiveTrend(Math.round((activeProjects.length / Math.max(projectsForCount.length, 1)) * 100));

    const blocked = tasks.filter((t) => t.status === "BLOCKED");
    setBlockedCount(blocked.length);

    const completed = tasks.filter((t) => t.status === "COMPLETED");
    const completedWithDue = completed.filter((t) => t.due_date);
    const onTime = completedWithDue.filter((t) => {
      const doneAt = t.completed_at || t.updated_at;
      return doneAt && new Date(doneAt) <= new Date(`${t.due_date}T23:59:59`);
    });
    setEfficiency(completedWithDue.length > 0 ? Math.round((onTime.length / completedWithDue.length) * 100) : 0);
    setEfficiencyInfo({ onTime: onTime.length, completedWithDue: completedWithDue.length });

    const today = startOfTodayLocal();
    const dueSoon = tasks.filter((t) => {
      if (!t.due_date || t.status === "COMPLETED") return false;
      const days = daysFromToday(t.due_date);
      return days !== null && days >= 0 && days <= 2;
    });
    setAlert48Count(dueSoon.length);

    const statusCounts: Record<string, number> = {};
    tasks.forEach((t) => {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    });
    setStatusData(
      Object.entries(statusCounts).map(([status, count]) => ({ status, count }))
    );

    if (allProfiles) {
      const load: CollaboratorLoad[] = allProfiles
        .filter((p) => p.capacity && p.capacity > 0)
        .map((p) => {
          const profileTasks = tasks.filter((t) => t.assignee_id === p.id);
          const totalH = profileTasks.reduce((s, t) => s + (Number(t.estimated_hours) || 0), 0);

          const overloads: { taskId: string; taskTitle: string; suggestedAssignee: string }[] = [];
          if (totalH > (p.capacity || 0)) {
            const sortedByHours = [...profileTasks].sort(
              (a, b) => (Number(b.estimated_hours) || 0) - (Number(a.estimated_hours) || 0)
            );
            for (const t of sortedByHours) {
              if (overloads.length >= 2) break;
              const altAssignee = allProfiles.find(
                (ap) => ap.id !== p.id && (ap.capacity || 0) > 0
              );
              if (altAssignee) {
                overloads.push({
                  taskId: t.id,
                  taskTitle: t.title,
                  suggestedAssignee: altAssignee.full_name || "Sin asignar",
                });
              }
            }
          }

          return {
            id: p.id,
            name: p.full_name || "Sin nombre",
            totalHours: totalH,
            capacity: p.capacity || 0,
            overloadTasks: overloads,
          };
        });
      setCollaborators(load);
    }

    const profileMap = new Map(
      (allProfiles || []).map((p) => [p.id, p.full_name || ""])
    );
    const projectMap = new Map(
      (allProjects || []).map((p) => [p.id, p.name])
    );
    const alerts: AlertTask[] = dueSoon.map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.due_date || "",
      assigneeName: (t.assignee_id ? profileMap.get(t.assignee_id) : null) || "Sin asignar",
      assigneeAvatar: "",
      status: t.status,
      projectName: projectMap.get(t.project_id) || "",
    }));
    setAlertTasks(alerts);
    }, [selectedAgency, selectedAccount, selectedProject, supabase, accounts, accountAgencies]);

  useEffect(() => {
    supabase.from("agencies").select("id, name").then(({ data }) => {
      if (data) setAgencies(data);
    });
    supabase.from("accounts").select("id, name").then(({ data }) => {
      if (data) setAccounts(data);
    });
    supabase.from("account_agencies").select("account_id, agency_id").then(({ data }) => {
      const grouped: Record<string, string[]> = {};
      if (data) {
        data.forEach((r) => {
          grouped[r.account_id] = grouped[r.account_id] || [];
          grouped[r.account_id].push(r.agency_id);
        });
      }
      setAccountAgencies(grouped);
    });
    supabase.from("projects").select("id, name, account_id").then(({ data }) => {
      if (data) setProjects(data);
    });
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredAccounts = selectedAgency
    ? accounts.filter((a) => accountAgencies[a.id]?.includes(selectedAgency))
    : accounts;

  const filteredProjects = selectedAccount
    ? projects.filter((p) => p.account_id === selectedAccount)
    : selectedAgency
      ? projects.filter((p) =>
          filteredAccounts.some((a) => a.id === p.account_id)
        )
      : projects;

  const kpiCards = [
    {
      label: "Proyectos Activos",
      value: totalActive,
      metric: `${activeTrend}% del total`,
      icon: <BarChart3 size={20} />,
      color: "var(--accent-cyan)",
      bg: "rgba(255,180,170,0.1)",
      trend: activeTrend,
    },
    {
      label: "Tareas Bloqueadas",
      value: blockedCount,
      metric: "Requieren atención",
      icon: <AlertTriangle size={20} />,
      color: "var(--accent-rose)",
      bg: "rgba(255,138,138,0.1)",
      trend: -blockedCount,
    },
    {
      label: "Eficiencia Global",
      value: efficiencyInfo.completedWithDue > 0 ? `${efficiency}%` : "—",
      metric: "Entregas a tiempo",
      detail: efficiencyInfo.completedWithDue > 0
        ? `De ${efficiencyInfo.completedWithDue} tareas completadas con fecha límite, ${efficiencyInfo.onTime} se entregaron dentro de plazo.`
        : "Sin entregas completadas con fecha límite aún.",
      icon: <TrendingUp size={20} />,
      color: efficiencyInfo.completedWithDue > 0 && efficiency >= 70 ? "var(--accent-green)" : "var(--accent-amber)",
      bg: efficiencyInfo.completedWithDue > 0 && efficiency >= 70 ? "rgba(125,216,125,0.1)" : "rgba(255,209,102,0.1)",
      trend: efficiencyInfo.completedWithDue > 0 ? efficiency : 0,
    },
    {
      label: "Alertas 48h",
      value: alert48Count,
      metric: "Vencen próximamente",
      icon: <Clock size={20} />,
      color: alert48Count > 0 ? "var(--accent-amber)" : "var(--accent-green)",
      bg: alert48Count > 0 ? "rgba(255,209,102,0.1)" : "rgba(125,216,125,0.1)",
      trend: -alert48Count,
    },
  ];

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Hierarchical Filters */}
      <div
        className="flex items-center gap-3 p-4 rounded-xl flex-wrap"
        style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
      >
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Agencia</label>
          <select
            value={selectedAgency}
            onChange={(e) => {
              setSelectedAgency(e.target.value);
              setSelectedAccount("");
              setSelectedProject("");
            }}
            className="px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">Todas las Agencias</option>
            {agencies.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <ChevronDown size={14} style={{ color: "var(--text-muted)", transform: "rotate(-90deg)" }} />

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Cuenta</label>
          <select
            value={selectedAccount}
            onChange={(e) => {
              setSelectedAccount(e.target.value);
              setSelectedProject("");
            }}
            className="px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">Todas las Cuentas</option>
            {filteredAccounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <ChevronDown size={14} style={{ color: "var(--text-muted)", transform: "rotate(-90deg)" }} />

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Proyecto</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">Todos los Proyectos</option>
            {filteredProjects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl p-4 transition-all hover:shadow-md"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: kpi.bg, color: kpi.color }}
              >
                {kpi.icon}
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: kpi.bg, color: kpi.color }}>
                {kpi.trend > 0 ? `+${kpi.trend}%` : `${kpi.trend}%`}
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{kpi.value}</p>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{kpi.label}</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{kpi.metric}</p>
            {"detail" in kpi && kpi.detail ? (
              <p className="text-[11px] mt-2 leading-snug" style={{ color: "var(--text-muted)", borderTop: "1px solid var(--card-border)", paddingTop: 8 }}>
                {kpi.detail}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Chart */}
        <div
          className="rounded-xl p-4 lg:col-span-1"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            <Activity size={14} className="inline mr-1.5" />
            Tareas por Estado
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
              >
                {statusData.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLORS[entry.status] || "#8a8a8a"}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  value,
                  STATUS_LABELS[name] || name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {statusData.map((s) => (
              <div key={s.status} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: STATUS_COLORS[s.status] || "#8a8a8a" }}
                />
                <span style={{ color: "var(--text-secondary)" }}>
                  {STATUS_LABELS[s.status] || s.status}: {s.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Workload Saturation */}
        <div
          className="rounded-xl p-4 lg:col-span-1"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            <Users size={14} className="inline mr-1.5" />
            Saturación de Colaboradores
          </h3>
          <div className="space-y-3">
            {collaborators.slice(0, 6).map((c) => {
              const pct = c.capacity > 0
                ? Math.round((c.totalHours / c.capacity) * 100)
                : 0;
              const isOver = pct > 100;
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium"
                        style={{
                          background: isOver
                            ? "rgba(255,138,138,0.15)"
                            : "rgba(125,216,125,0.15)",
                          color: isOver
                            ? "var(--accent-rose)"
                            : "var(--accent-green)",
                        }}
                      >
                        {c.name.charAt(0)}
                      </div>
                      <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                        {c.name}
                      </span>
                    </div>
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color: isOver
                          ? "var(--accent-rose)"
                          : "var(--text-secondary)",
                      }}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--divider)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: isOver
                          ? "var(--accent-rose)"
                          : pct > 80
                            ? "var(--accent-amber)"
                            : "var(--accent-green)",
                      }}
                    />
                  </div>
                  {isOver && c.overloadTasks.length > 0 && (
                    <div
                      className="mt-1.5 p-2 rounded-lg text-[11px]"
                      style={{
                        background: "rgba(255,138,138,0.08)",
                        border: "1px solid rgba(255,138,138,0.15)",
                      }}
                    >
                      <div className="flex items-center gap-1 mb-1" style={{ color: "var(--accent-rose)" }}>
                        <AlertCircle size={11} />
                        <span className="font-medium">Sugerencia:</span>
                      </div>
                      {c.overloadTasks.map((ot) => (
                        <div key={ot.taskId} className="ml-3" style={{ color: "var(--text-secondary)" }}>
                          Reasignar <strong style={{ color: "var(--text-primary)" }}>{ot.taskTitle}</strong> a {ot.suggestedAssignee}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {collaborators.length === 0 && (
              <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>
                Sin datos de carga
              </p>
            )}
          </div>
        </div>

        {/* 48h Alerts */}
        <div
          className="rounded-xl p-4 lg:col-span-1"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            <Clock size={14} className="inline mr-1.5" />
            Alertas 48 Horas
          </h3>
          <div className="space-y-2">
            {alertTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <UserCheck size={28} style={{ color: "var(--accent-green)" }} />
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                  Sin alertas próximas
                </p>
              </div>
            ) : (
              alertTasks.slice(0, 8).map((t) => {
                const due = localMidnight(t.dueDate);
                const diffMs = due ? due.getTime() - startOfTodayLocal().getTime() : 0;
                const diffH = Math.round(diffMs / (1000 * 60 * 60));
                const isUrgent = diffH <= 24;
                return (
                  <div
                    key={t.id}
                    className="p-3 rounded-lg"
                    style={{
                      background: isUrgent
                        ? "rgba(255,138,138,0.08)"
                        : "var(--accordion-bg)",
                      border: `1px solid ${
                        isUrgent
                          ? "rgba(255,138,138,0.2)"
                          : "var(--border-light)"
                      }`,
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle
                        size={14}
                        className="mt-0.5 shrink-0"
                        style={{
                          color: isUrgent
                            ? "var(--accent-rose)"
                            : "var(--accent-amber)",
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-xs font-medium truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {t.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-medium"
                            style={{
                              background: "var(--divider)",
                              color: "var(--text-muted)",
                            }}
                          >
                            {t.assigneeName.charAt(0)}
                          </div>
                          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                            {t.assigneeName}
                          </span>
                          <span
                            className="text-[11px] font-semibold"
                            style={{
                              color: isUrgent
                                ? "var(--accent-rose)"
                                : "var(--accent-amber)",
                            }}
                          >
                            {diffH}h
                          </span>
                        </div>
                        {t.projectName && (
                          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {t.projectName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
