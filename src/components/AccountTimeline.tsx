"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { CalendarDays, ChevronDown, ChevronRight } from "lucide-react";

interface ProjectRow {
  id: string;
  name: string;
  brief_date: string | null;
  end_date: string | null;
  launch_date: string | null;
  presentation_date: string | null;
  creative_status: string;
  account_id: string;
}

interface TaskItem {
  id: string;
  project_id: string;
  title: string;
  status: string;
  start_date: string | null;
  due_date: string | null;
  delivered_at: string | null;
}

interface Props {
  accountId: string;
  accountName: string;
}

const PROJECT_STATUS_COLORS: Record<string, string> = {
  Ajustes: "var(--accent-rose)",
  "In Progress": "var(--accent-rose)",
  "To do": "var(--accent-rose)",
  Review: "var(--accent-rose)",
};

const TASK_STATUS_COLORS: Record<string, string> = {
  PENDING: "var(--accent-amber)",
  IN_PROGRESS: "var(--accent-cyan)",
  REVIEW: "var(--accent-purple)",
  COMPLETED: "var(--accent-green)",
  BLOCKED: "var(--accent-rose)",
  BACKLOG: "var(--text-muted)",
};

const DAY_WIDTH = 34;

export function AccountTimeline({ accountId, accountName }: Props) {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accountId) return;
    const supabase = createClient();
    setLoading(true);
    Promise.all([
      supabase.from("projects").select("id, name, brief_date, end_date, launch_date, presentation_date, creative_status, account_id").eq("account_id", accountId),
      supabase.from("tasks").select("id, project_id, title, status, start_date, due_date, delivered_at").order("start_date"),
    ]).then(([projRes, taskRes]) => {
      const rows = (projRes.data as ProjectRow[]) || [];
      const allTasks = (taskRes.data as TaskItem[]) || [];
      const projIds = new Set(rows.map((p) => p.id));
      setProjects(rows);
      setTasks(allTasks.filter((t) => projIds.has(t.project_id)));
      setLoading(false);
    });
  }, [accountId]);

  const projStart = (p: ProjectRow) => p.brief_date || p.end_date || p.launch_date || "";
  const projEnd = (p: ProjectRow) => p.end_date || p.launch_date || p.presentation_date || p.brief_date || "";

  const { range, totalWidth, todayX, todayMs } = useMemo(() => {
    const allDates: number[] = [];
    projects.forEach((p) => {
      if (projStart(p)) allDates.push(new Date(projStart(p)).getTime());
      if (projEnd(p)) allDates.push(new Date(projEnd(p)).getTime());
    });
    tasks.forEach((t) => {
      if (t.start_date) allDates.push(new Date(t.start_date).getTime());
      if (t.due_date) allDates.push(new Date(t.due_date).getTime());
      if (t.delivered_at) allDates.push(new Date(t.delivered_at).getTime());
    });
    const now = new Date();
    allDates.push(now.getTime());
    if (allDates.length === 0) return { range: [now, now], totalWidth: 800, todayX: 0, todayMs: now.getTime() };

    const min = new Date(Math.min(...allDates));
    const max = new Date(Math.max(...allDates));
    const dates: Date[] = [];
    const cur = new Date(min);
    cur.setHours(0, 0, 0, 0);
    const maxDay = new Date(max);
    maxDay.setHours(23, 59, 59, 999);
    while (cur <= maxDay) {
      dates.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    if (dates.length === 0) dates.push(new Date());
    const total = dates.length * DAY_WIDTH;
    const first = dates[0].getTime();
    const last = dates[dates.length - 1].getTime();
    const span = last - first || 1;
    const xOf = (ms: number) => ((ms - first) / span) * total;
    const tMs = now.getTime();
    return { range: dates, totalWidth: total, todayX: xOf(tMs), todayMs: tMs };
  }, [projects, tasks]);

  const visibleProjects = projects.filter((p) => projStart(p) || projEnd(p));

  const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("es", { day: "2-digit", month: "2-digit" }) : "—");

  const monthMarkers = useMemo(() => {
    const seen = new Set<string>();
    const markers: { x: number; label: string }[] = [];
    range.forEach((d, i) => {
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!seen.has(key)) {
        seen.add(key);
        const span = range[range.length - 1].getTime() - range[0].getTime() || 1;
        const x = ((d.getTime() - range[0].getTime()) / span) * totalWidth;
        markers.push({ x, label: d.toLocaleDateString("es", { month: "short", year: "2-digit" }) });
      }
    });
    return markers;
  }, [range, totalWidth]);

  const barX = (start: string, end: string) => {
    const span = range[range.length - 1].getTime() - range[0].getTime() || 1;
    const first = range[0].getTime();
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const left = ((s - first) / span) * totalWidth;
    const width = Math.max(((e - s) / span) * totalWidth, DAY_WIDTH * 0.8);
    return { left, width };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid" style={{ borderColor: "var(--accent-cyan)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (visibleProjects.length === 0) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
        <p style={{ color: "var(--text-muted)" }}>No hay proyectos con fechas para {accountName || "esta marca"}</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="rounded-xl p-5" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <CalendarDays size={16} style={{ color: "var(--accent-cyan)" }} />
            Timeline de Proyectos y Tareas — {accountName}
          </h2>
          <div className="flex items-center gap-3 text-[10px] flex-wrap" style={{ color: "var(--text-muted)" }}>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--accent-cyan)" }} /> En Progreso</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--accent-green)" }} /> Completado</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--accent-amber)" }} /> Pendiente</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--accent-rose)" }} /> Bloqueado</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Month header */}
            <div className="relative h-6 mb-1" style={{ marginLeft: 260 }}>
              {monthMarkers.map((m, i) => (
                <span key={i} className="absolute text-[10px] font-semibold uppercase tracking-wider -translate-x-1/2" style={{ left: m.x, color: "var(--text-muted)" }}>
                  {m.label}
                </span>
              ))}
              {/* Today line */}
              <div className="absolute top-0 bottom-0 w-px" style={{ left: todayX, background: "var(--accent-rose)", opacity: 0.7 }} />
            </div>

            {/* Projects */}
            <div className="space-y-1.5">
              {visibleProjects.map((p) => {
                const isCollapsed = collapsed.has(p.id);
                const projTasks = tasks.filter((t) => t.project_id === p.id).sort((a, b) => (a.start_date || "").localeCompare(b.start_date || ""));
                const s = projStart(p);
                const e = projEnd(p);
                const hasBar = !!(s && e && new Date(s).getTime() <= new Date(e).getTime());
                const bar = hasBar ? barX(s, e) : null;
                const color = PROJECT_STATUS_COLORS[p.creative_status] || "var(--text-muted)";

                return (
                  <div key={p.id}>
                    <div className="flex items-center rounded-lg hover:opacity-95 transition-all" style={{ background: "var(--glass-bg, rgba(0,0,0,0.02))", border: "1px solid var(--card-border)" }}>
                      <div className="flex items-center gap-1.5 shrink-0 cursor-pointer select-none pr-2" style={{ width: 260 }} onClick={() => setCollapsed((prev) => { const n = new Set(prev); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n; })}>
                        {isCollapsed ? <ChevronRight size={14} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />}
                        <span className="text-[12px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{p.name}</span>
                        <span className="ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: `${color}22`, color }}>{p.creative_status || "—"}</span>
                      </div>
                      <div className="relative flex-1" style={{ height: 30 }}>
                        {bar && (
                          <div className="absolute top-1/2 -translate-y-1/2 rounded-full flex items-center overflow-hidden" style={{ left: bar.left, width: bar.width, background: color, opacity: 0.35, border: `1px solid ${color}` }}>
                            <span className="text-[9px] font-medium px-1.5 whitespace-nowrap" style={{ color: "var(--text-primary)", opacity: 0.9 }}>
                              {fmt(s)} → {fmt(e)}
                            </span>
                          </div>
                        )}
                        <div className="absolute top-0 bottom-0 w-px" style={{ left: todayX, background: "var(--accent-rose)", opacity: 0.4 }} />
                      </div>
                    </div>

                    {!isCollapsed && projTasks.length > 0 && (
                      <div className="mt-0.5 space-y-0.5 pl-6">
                        {projTasks.map((t) => {
                          const hasTaskBar = t.start_date && t.due_date && new Date(t.start_date).getTime() <= new Date(t.due_date).getTime();
                          const tBar = hasTaskBar ? barX(t.start_date!, t.due_date!) : null;
                          const tColor = TASK_STATUS_COLORS[t.status] || "var(--text-muted)";
                          return (
                            <div key={t.id} className="flex items-center rounded-md" style={{ background: "rgba(0,0,0,0.015)" }}>
                              <div className="flex items-center gap-1.5 shrink-0 pr-2" style={{ width: 254 }}>
                                <span className="text-[11px] truncate" style={{ color: "var(--text-secondary)" }}>{t.title}</span>
                                <span className="ml-auto text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0" style={{ background: `${tColor}22`, color: tColor }}>
                                  {t.status.replace("_", " ")}
                                </span>
                              </div>
                              <div className="relative flex-1" style={{ height: 20 }}>
                                {tBar && (
                                  <div className="absolute top-1/2 -translate-y-1/2 rounded" style={{ left: tBar.left, width: tBar.width, background: tColor, opacity: 0.55 }}>
                                    {t.delivered_at && <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px]" style={{ color: "var(--text-primary)", opacity: 0.9 }}>✓</span>}
                                  </div>
                                )}
                                <div className="absolute top-0 bottom-0 w-px" style={{ left: todayX, background: "var(--accent-rose)", opacity: 0.25 }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
