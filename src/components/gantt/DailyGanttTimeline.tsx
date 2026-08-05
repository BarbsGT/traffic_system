"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, CalendarDays, LocateFixed, Search } from "lucide-react";
import type { DailyGanttItem, MilestoneType } from "./DailyGanttTypes";

interface TooltipState {
  item: DailyGanttItem;
  x: number;
  y: number;
}

interface ProjectGroup {
  projectId: string;
  projectName: string;
  accountName: string;
  projectStatus?: string;
  startDate: string;
  endDate: string;
  items: DailyGanttItem[];
}

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const MILESTONE_STYLE: Record<MilestoneType, { bar: string; dot: string; label: string }> = {
  AGENCY_EXECUTION: { bar: "bg-blue-600", dot: "bg-blue-600", label: "Ejecución Agencia" },
  CLIENT_APPROVAL: { bar: "bg-rose-600", dot: "bg-rose-600", label: "Aprobación Cliente" },
  DELIVERY: { bar: "bg-purple-600", dot: "bg-purple-600", label: "Entrega Final / Assets" },
  GO_LIVE: { bar: "bg-emerald-500", dot: "bg-emerald-500", label: "Lanzamiento / Go-Live" },
};

const TASK_STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pendiente", color: "var(--accent-amber)", bg: "rgba(245,158,11,0.15)" },
  IN_PROGRESS: { label: "En Progreso", color: "var(--accent-cyan)", bg: "rgba(14,165,233,0.15)" },
  REVIEW: { label: "Revisión", color: "var(--accent-purple)", bg: "rgba(139,92,246,0.15)" },
  COMPLETED: { label: "Completado", color: "var(--accent-green)", bg: "rgba(16,185,129,0.15)" },
  BLOCKED: { label: "Bloqueado", color: "var(--accent-rose)", bg: "rgba(244,63,94,0.15)" },
};

const STICKY_W = 572;
const STATUS_W = 100;
const HEADER_H = 33;

const MIN_DAYS_VISIBLE = 60;
const FUTURE_BUFFER_DAYS = 150;

function parseDay(iso: string): Date {
  const d = new Date(iso + "T00:00:00");
  return d;
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function fmtDay(d: Date) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function fmtMonth(d: Date) {
  return `${d.toLocaleDateString("es", { month: "long" }).toUpperCase()} ${d.getFullYear()}`;
}

function workingDays(startIso: string, endIso: string): number {
  const s = parseDay(startIso);
  const e = parseDay(endIso);
  let count = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
}

function getAvatarColor(name: string) {
  const colors = ["var(--accent-blue)", "var(--accent-purple)", "var(--accent-cyan)", "var(--accent-green)", "var(--accent-amber)"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
}

interface Props {
  items: DailyGanttItem[];
  loading?: boolean;
  error?: string | null;
}

export function DailyGanttTimeline({ items, loading = false, error = null }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [viewportW, setViewportW] = useState<number>(1200);
  const [responsibleFilter, setResponsibleFilter] = useState<string>("all");
  const [milestoneFilter, setMilestoneFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    const measure = () => {
      if (viewportRef.current) setViewportW(viewportRef.current.clientWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (viewportRef.current) ro.observe(viewportRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const responsibleOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => set.add(it.responsibleName));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => { if (it.status) set.add(it.status); });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((it) => {
      if (responsibleFilter !== "all" && it.responsibleName !== responsibleFilter) return false;
      if (milestoneFilter !== "all" && it.milestoneType !== milestoneFilter) return false;
      if (statusFilter !== "all" && it.status !== statusFilter) return false;
      if (q) {
        const hay = `${it.activityTitle} ${it.projectName} ${it.responsibleName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, responsibleFilter, milestoneFilter, statusFilter, searchQuery]);

  const availableYears = useMemo(() => {
    const set = new Set<number>([new Date().getFullYear()]);
    filteredItems.forEach((it) => {
      set.add(parseDay(it.startDate).getFullYear());
      set.add(parseDay(it.endDate).getFullYear());
    });
    return [...set].sort((a, b) => a - b);
  }, [filteredItems]);

  // Rolling timeline window: at least 60 days starting from today-7, with future room to scroll.
  const { days, monthGroups, rangeStartMs, rangeEndMs } = useMemo(() => {
    const today = startOfDay(new Date());
    const startDates = filteredItems.map((it) => parseDay(it.startDate));
    const endDates = filteredItems.map((it) => parseDay(it.endDate));
    const minData = startDates.length ? new Date(Math.min(...startDates.map((d) => d.getTime()))) : undefined;
    const maxData = endDates.length ? new Date(Math.max(...endDates.map((d) => d.getTime()))) : undefined;
    const rangeStart = minData && minData.getTime() < today.getTime() ? addDays(minData, -7) : addDays(today, -7);
    const minEnd = addDays(rangeStart, MIN_DAYS_VISIBLE - 1);
    const futureEnd = addDays(today, FUTURE_BUFFER_DAYS);
    const dataEnd = maxData || today;
    const rangeEnd = [minEnd, dataEnd, futureEnd].reduce((a, b) => (b > a ? b : a));

    const dayList: Date[] = [];
    for (let d = new Date(rangeStart); d <= rangeEnd; d.setDate(d.getDate() + 1)) dayList.push(new Date(d));

    const groups: { label: string; days: Date[] }[] = [];
    dayList.forEach((d) => {
      const last = groups[groups.length - 1];
      if (!last || last.label !== fmtMonth(d)) {
        groups.push({ label: fmtMonth(d), days: [d] });
      } else {
        last.days.push(d);
      }
    });

    return {
      days: dayList,
      monthGroups: groups,
      rangeStartMs: rangeStart.getTime(),
      rangeEndMs: rangeEnd.getTime(),
    };
  }, [filteredItems]);

  // Day width sized so at least ~60 columns fit on screen (Google Calendar style).
  const DAY_W = useMemo(() => {
    const avail = Math.max(viewportW - STICKY_W, 300);
    return Math.max(14, Math.min(36, Math.floor(avail / MIN_DAYS_VISIBLE)));
  }, [viewportW]);

  const todayIdx = useMemo(() => {
    const t = startOfDay(new Date());
    const idx = days.findIndex((d) => sameDay(d, t));
    return idx;
  }, [days]);

  const visibleItems = useMemo(() => {
    return filteredItems.filter((it) => {
      const s = parseDay(it.startDate).getTime();
      const e = parseDay(it.endDate).getTime();
      return e >= rangeStartMs && s <= rangeEndMs;
    });
  }, [filteredItems, rangeStartMs, rangeEndMs]);

  const groups = useMemo<ProjectGroup[]>(() => {
    const map = new Map<string, DailyGanttItem[]>();
    visibleItems.forEach((it) => {
      const list = map.get(it.projectId) || [];
      list.push(it);
      map.set(it.projectId, list);
    });
    const arr: ProjectGroup[] = [...map.entries()].map(([projectId, list]) => {
      const projectItem = list.find((it) => it.isProject);
      const taskItems = list.filter((it) => !it.isProject).sort((a, b) => parseDay(a.startDate).getTime() - parseDay(b.startDate).getTime());
      const gStart = projectItem ? projectItem.startDate : (taskItems[0]?.startDate || "");
      const gEnd = projectItem ? projectItem.endDate : (taskItems[taskItems.length - 1]?.endDate || gStart);
      return {
        projectId,
        projectName: projectItem?.projectName || taskItems[0]?.projectName || "Proyecto",
        accountName: projectItem?.accountName || taskItems[0]?.accountName || "",
        projectStatus: projectItem?.status,
        startDate: gStart,
        endDate: gEnd,
        items: taskItems,
      };
    });
    arr.sort((a, b) => a.projectName.localeCompare(b.projectName));
    return arr;
  }, [visibleItems]);

  const totalDays = Math.max(days.length, 1);
  const gridWidth = totalDays * DAY_W;

  const barGeometry = (startIso: string, endIso: string) => {
    const sMs = parseDay(startIso).getTime();
    const eMs = parseDay(endIso).getTime();
    const left = Math.max(0, Math.round(((sMs - rangeStartMs) / (rangeEndMs - rangeStartMs || 1)) * gridWidth));
    const right = Math.min(gridWidth, Math.round(((eMs - rangeStartMs) / (rangeEndMs - rangeStartMs || 1)) * gridWidth) + DAY_W);
    return { left, width: Math.max(right - left, DAY_W) };
  };

  const scrollToDayIndex = useCallback((idx: number) => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    el.scrollTo({ left: Math.max(0, idx * DAY_W), behavior: "smooth" });
  }, [DAY_W]);

  const goToToday = () => scrollToDayIndex(Math.max(todayIdx, 0));

  // Auto-scroll so "today" is near the left edge on load (Google Calendar style)
  useEffect(() => {
    if (!loading && todayIdx >= 0 && scrollRef.current) {
      scrollRef.current.scrollLeft = Math.max(0, todayIdx * DAY_W);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, days.length]);

  const jumpToMonth = (year: number, month: number) => {
    const d = new Date(year, month, 1);
    const target = new Date(d);
    if (target.getTime() < rangeStartMs) return;
    const idx = Math.round((target.getTime() - rangeStartMs) / 86400000);
    scrollToDayIndex(idx);
  };

  const jumpToYear = (year: number) => {
    const d = new Date(year, 0, 1);
    if (d.getTime() < rangeStartMs) return;
    const idx = Math.round((d.getTime() - rangeStartMs) / 86400000);
    scrollToDayIndex(idx);
  };

  const showTooltip = (item: DailyGanttItem, e: React.MouseEvent) => {
    setTooltip({ item, x: e.clientX, y: e.clientY });
  };

  const toggleGroup = (projectId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const expandAll = () => setCollapsedGroups(new Set());
  const collapseAll = () => setCollapsedGroups(new Set(groups.map((g) => g.projectId)));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid" style={{ borderColor: "var(--accent-cyan)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
        <p style={{ color: "var(--accent-rose)" }}>Error cargando el cronograma: {error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
        <p style={{ color: "var(--text-muted)" }}>No hay actividades con fechas definidas.</p>
      </div>
    );
  }

  const filterCount = filteredItems.filter((it) => !it.isProject).length;

  return (
    <div className="animate-fadeIn space-y-4">
      {/* ===== Toolbar / Filters ===== */}
      <div className="rounded-xl p-3" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Year selector */}
          <select
            value={String(new Date().getFullYear())}
            onChange={(e) => jumpToYear(Number(e.target.value))}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none cursor-pointer"
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Month quick jump */}
          <div className="flex items-center gap-0.5 overflow-x-auto" style={{ maxWidth: 480 }}>
            {MONTHS.map((m, i) => (
              <button
                key={m}
                onClick={() => jumpToMonth(new Date().getFullYear(), i)}
                className="px-2 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all hover:opacity-80"
                style={{
                  background: "transparent",
                  color: "var(--text-secondary)",
                  border: "1px solid transparent",
                }}
                title={`Ir a ${m}`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Today focus */}
          <button
            onClick={goToToday}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-85"
            style={{ background: "var(--accent-rose)" }}
          >
            <LocateFixed size={14} /> Hoy
          </button>

          <div className="w-px h-5" style={{ background: "var(--divider)" }} />

          {/* Responsible filter */}
          <select
            value={responsibleFilter}
            onChange={(e) => setResponsibleFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium outline-none cursor-pointer"
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
          >
            <option value="all">Todos los responsables</option>
            {responsibleOptions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {/* Milestone filter */}
          <select
            value={milestoneFilter}
            onChange={(e) => setMilestoneFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium outline-none cursor-pointer"
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
          >
            <option value="all">Todos los tipos</option>
            {(Object.keys(MILESTONE_STYLE) as MilestoneType[]).map((k) => (
              <option key={k} value={k}>{MILESTONE_STYLE[k].label}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium outline-none cursor-pointer"
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
          >
            <option value="all">Todos los estados</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{(TASK_STATUS_STYLE[s]?.label) || s.replace("_", " ")}</option>
            ))}
          </select>

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar actividad…"
              className="pl-8 pr-2.5 py-1.5 rounded-lg text-xs font-medium outline-none"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)", width: 180 }}
            />
          </div>

          {/* Expand / collapse */}
          <div className="flex items-center gap-1">
            <button onClick={expandAll} className="px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all hover:opacity-80"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-secondary)" }}>
              Expandir todo
            </button>
            <button onClick={collapseAll} className="px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all hover:opacity-80"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-secondary)" }}>
              Colapsar todo
            </button>
          </div>

          <span className="text-[10px] font-semibold ml-auto" style={{ color: "var(--text-muted)" }}>
            {groups.length} {groups.length === 1 ? "proyecto" : "proyectos"} · {filterCount} {filterCount === 1 ? "actividad" : "actividades"} · {Math.round(gridWidth / DAY_W)} días de {fmtMonth(days[0])} a {fmtMonth(days[days.length - 1])}
          </span>
        </div>
        <p className="mt-2 text-[9px]" style={{ color: "var(--text-muted)" }}>
          Desplázate horizontalmente para ver más fechas. Las columnas de la izquierda permanecen fijas.
        </p>
      </div>

      {/* ===== Gantt (scrollable body, frozen left columns) ===== */}
      <div className="rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
        <div ref={viewportRef} className="overflow-hidden" style={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
          <div ref={scrollRef} className="overflow-auto" style={{ maxHeight: "calc(100vh - 250px)" }}>
            <div className="relative" style={{ width: STICKY_W + gridWidth, minWidth: "100%" }}>
              {/* ===== Header Level 1: Month ===== */}
              <div className="sticky top-0 z-30 flex" style={{ background: "var(--card-bg)", borderBottom: "1px solid var(--divider)", height: HEADER_H }}>
                <div className="sticky left-0 z-40 flex items-center px-3 shrink-0 gap-2" style={{ width: STICKY_W, background: "var(--card-bg)", borderRight: "1px solid var(--divider)", height: HEADER_H }}>
                  <CalendarDays size={13} style={{ color: "var(--accent-cyan)" }} />
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>Timeline</span>
                </div>
                {monthGroups.map((g, i) => (
                  <div key={i} className="flex items-center justify-center text-[11px] font-bold uppercase tracking-wider shrink-0"
                    style={{ width: g.days.length * DAY_W, color: "var(--text-secondary)", borderRight: "1px solid var(--divider)", height: HEADER_H }}>
                    {g.label}
                  </div>
                ))}
              </div>

              {/* ===== Header Level 2: Days ===== */}
              <div className="sticky z-30 flex" style={{ background: "var(--card-bg)", borderBottom: "1px solid var(--divider)", top: HEADER_H }}>
                <div className="sticky left-0 z-40 flex shrink-0 items-end justify-end gap-px" style={{ width: STICKY_W, background: "var(--card-bg)", borderRight: "1px solid var(--divider)" }}>
                  <div className="w-[64px] flex items-center justify-center py-1 text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Inicio</div>
                  <div className="w-[64px] flex items-center justify-center py-1 text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Fin</div>
                  <div className="w-[124px] flex items-center justify-center py-1 text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Responsable</div>
                  <div className="w-[220px] flex items-center justify-center py-1 text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Actividad</div>
                  <div className="w-[100px] flex items-center justify-center py-1 text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Estado</div>
                </div>
                {days.map((d, i) => {
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isToday = i === todayIdx;
                  return (
                    <div key={i} className="flex flex-col items-center justify-center py-1 shrink-0 relative cursor-pointer"
                      onClick={() => scrollToDayIndex(i)}
                      style={{
                        width: DAY_W,
                        background: isToday ? "rgba(244,63,94,0.12)" : isWeekend ? "rgba(148,163,184,0.10)" : "transparent",
                      }}>
                      <span className="text-[9px] leading-none" style={{ color: isToday ? "var(--accent-rose)" : "var(--text-muted)", fontWeight: isToday ? 700 : 500 }}>
                        {d.getDate()}
                      </span>
                      <span className="text-[8px] leading-tight" style={{ color: "var(--text-muted)" }}>{MONTHS[d.getMonth()].toLowerCase()}</span>
                      {isToday && <span className="absolute top-full left-1/2 -translate-x-1/2 text-[7px] font-bold text-white px-1 rounded-sm" style={{ background: "var(--accent-rose)" }}>HOY</span>}
                    </div>
                  );
                })}
              </div>

              {/* ===== Body ===== */}
              <div className="relative">
                {groups.length === 0 && (
                  <div className="py-10 text-center text-xs" style={{ color: "var(--text-muted)" }}>Sin actividades en este rango.</div>
                )}
                {groups.map((group) => {
                  const isCollapsed = collapsedGroups.has(group.projectId);
                  const gStart = group.startDate;
                  const gEnd = group.endDate;
                  const gBar = barGeometry(gStart, gEnd);
                  return (
                    <div key={group.projectId}>
                      {/* Project header row */}
                      <div className="flex items-stretch" style={{ minHeight: 36 }}>
                        <div className="sticky left-0 z-20 flex items-center shrink-0 cursor-pointer select-none"
                          style={{ width: STICKY_W, background: "var(--card-bg)", borderBottom: "1px solid var(--divider)", borderTop: "1px solid var(--divider)" }}
                          onClick={() => toggleGroup(group.projectId)}>
                          <div className="flex items-center gap-1.5 px-2 w-full">
                            {isCollapsed ? <ChevronRight size={14} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />}
                            <span className="text-[11px] font-bold truncate" style={{ color: "var(--text-primary)" }}>{group.projectName}</span>
                            {group.projectStatus && (
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-secondary)" }}>
                                {group.projectStatus}
                              </span>
                            )}
                            {group.accountName && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "var(--glass-bg)", border: "1px solid var(--card-border)", color: "var(--text-muted)" }}>
                                {group.accountName}
                              </span>
                            )}
                            <span className="ml-auto text-[9px] font-semibold shrink-0" style={{ color: "var(--text-muted)" }}>
                              {group.items.length} {group.items.length === 1 ? "actividad" : "actividades"}
                            </span>
                          </div>
                          <div className="flex items-center w-[100px] px-1.5 shrink-0" style={{ borderBottom: "1px solid var(--divider)", borderTop: "1px solid var(--divider)" }}>
                            {group.projectStatus && (
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full truncate" style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-secondary)" }}>
                                {group.projectStatus}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="relative flex-1 shrink-0" style={{ width: gridWidth, background: "rgba(148,163,184,0.03)", borderBottom: "1px solid var(--divider)" }}>
                          {days.map((d, i) => {
                            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                            const isToday = i === todayIdx;
                            return (
                              <div key={i} className="absolute top-0 bottom-0"
                                style={{
                                  left: i * DAY_W,
                                  width: DAY_W,
                                  background: isToday ? "rgba(244,63,94,0.10)" : isWeekend ? "rgba(148,163,184,0.07)" : "transparent",
                                  borderRight: "1px solid var(--border-light)",
                                }} />
                            );
                          })}
                          {todayIdx >= 0 && (
                            <div className="absolute top-0 bottom-0 z-10" style={{ left: todayIdx * DAY_W + DAY_W / 2, width: 2, background: "var(--accent-rose)", opacity: 0.8 }} />
                          )}
                          <div className="absolute top-1/2 -translate-y-1/2 rounded-md flex items-center overflow-hidden"
                            style={{ left: gBar.left, width: gBar.width, height: 24, background: "var(--accent-cyan)", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
                            <span className="text-[9px] font-bold px-2 whitespace-nowrap truncate" style={{ color: "#fff" }}>
                              {fmtDay(parseDay(gStart))} → {fmtDay(parseDay(gEnd))}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Task rows */}
                      {!isCollapsed && group.items.map((it) => {
                        const geom = barGeometry(it.startDate, it.endDate);
                        const style = MILESTONE_STYLE[it.milestoneType];
                        return (
                          <div key={it.id} className="flex items-stretch" style={{ minHeight: 34 }}>
                            <div className="sticky left-0 z-20 flex items-center shrink-0"
                              style={{ width: STICKY_W, background: "var(--card-bg)", borderBottom: "1px solid var(--divider)" }}>
                              <div className="flex items-center w-[64px] px-1.5">
                                <span className="text-[10px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{fmtDay(parseDay(it.startDate))}</span>
                              </div>
                              <div className="flex items-center w-[64px] px-1.5">
                                <span className="text-[10px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{fmtDay(parseDay(it.endDate))}</span>
                              </div>
                              <div className="flex items-center gap-1.5 w-[124px] px-1.5">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                                  style={{ background: getAvatarColor(it.responsibleName) }}>
                                  {initials(it.responsibleName)}
                                </span>
                                <span className="text-[10px] truncate" style={{ color: "var(--text-secondary)" }}>{it.responsibleName}</span>
                              </div>
                              <div className="flex items-center w-[220px] px-1.5">
                                <span className="text-[10px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{it.activityTitle}</span>
                              </div>
                              <div className="flex items-center w-[100px] px-1.5">
                                {it.status ? (
                                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full truncate"
                                    style={{ background: TASK_STATUS_STYLE[it.status]?.bg || "var(--input-bg)", border: "1px solid var(--input-border)", color: TASK_STATUS_STYLE[it.status]?.color || "var(--text-secondary)" }}>
                                    {TASK_STATUS_STYLE[it.status]?.label || it.status.replace("_", " ")}
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-center w-full" style={{ color: "var(--text-muted)" }}>—</span>
                                )}
                              </div>
                            </div>

                            <div className="relative flex-1 shrink-0" style={{ width: gridWidth }}>
                              {days.map((d, i) => {
                                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                                const isToday = i === todayIdx;
                                return (
                                  <div key={i} className="absolute top-0 bottom-0"
                                    style={{
                                      left: i * DAY_W,
                                      width: DAY_W,
                                      background: isToday ? "rgba(244,63,94,0.10)" : isWeekend ? "rgba(148,163,184,0.07)" : "transparent",
                                      borderRight: "1px solid var(--border-light)",
                                    }} />
                                );
                              })}
                              {todayIdx >= 0 && (
                                <div className="absolute top-0 bottom-0 z-10" style={{ left: todayIdx * DAY_W + DAY_W / 2, width: 2, background: "var(--accent-rose)", opacity: 0.8 }} />
                              )}
                              <div
                                className={`absolute top-1/2 -translate-y-1/2 rounded-md ${style.bar} cursor-pointer transition-transform hover:scale-y-110`}
                                style={{ left: geom.left, width: geom.width, height: 22, minWidth: DAY_W - 2, boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }}
                                onMouseEnter={(e) => showTooltip(it, e)}
                                onMouseMove={(e) => showTooltip(it, e)}
                                onMouseLeave={() => setTooltip(null)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-[10px]" style={{ color: "var(--text-muted)" }}>
        {(Object.keys(MILESTONE_STYLE) as MilestoneType[]).map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-sm ${MILESTONE_STYLE[k].dot}`} />
            {MILESTONE_STYLE[k].label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="w-0.5 h-4 rounded-full" style={{ background: "var(--accent-rose)" }} />
          Hoy
        </span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="fixed z-50 pointer-events-none rounded-xl p-3 shadow-lg animate-fadeIn"
          style={{ left: Math.min(tooltip.x + 14, window.innerWidth - 280), top: tooltip.y - 120, width: 260, background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold leading-snug" style={{ color: "var(--text-primary)" }}>{tooltip.item.activityTitle}</span>
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${MILESTONE_STYLE[tooltip.item.milestoneType].dot}`} />
          </div>
          {tooltip.item.projectName && (
            <p className="text-[10px] mb-0.5" style={{ color: "var(--text-secondary)" }}>
              {tooltip.item.projectName}
              {tooltip.item.accountName ? ` · ${tooltip.item.accountName}` : ""}
            </p>
          )}
          <p className="text-[10px] mb-2 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white" style={{ background: getAvatarColor(tooltip.item.responsibleName) }}>
              {initials(tooltip.item.responsibleName)}
            </span>
            {tooltip.item.responsibleName}
          </p>
          <div className="flex items-center justify-between text-[10px] py-1 px-2 rounded-lg" style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}>
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{fmtDay(parseDay(tooltip.item.startDate))}</span>
            <span style={{ color: "var(--text-muted)" }}>→</span>
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{fmtDay(parseDay(tooltip.item.endDate))}</span>
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "var(--accent-cyan)", color: "#fff" }}>
              {workingDays(tooltip.item.startDate, tooltip.item.endDate)}d háb
            </span>
          </div>
          {tooltip.item.status && (
            <p className="text-[9px] mt-1.5 font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Estado: <span style={{ color: "var(--text-secondary)" }}>{tooltip.item.status.replace("_", " ")}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
