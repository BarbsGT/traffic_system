"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { trackCellUpdate, trackQuickCreate } from "@/lib/analytics/telemetry";
import { TaskDetailPanel, type DeliveryTimeliness, type ComplianceStatus } from "./TaskDetailPanel";
import {
  Search, Plus, Calendar, Clock, X, ChevronDown, ChevronRight,
} from "lucide-react";

interface Agency { id: string; name: string }
interface Account { id: string; name: string; agency_id: string }
interface Profile { id: string; full_name: string; avatar_url: string }

interface TrafficRow {
  id: string;
  idx: number;
  agencyId: string;
  agencyName: string;
  accountId: string;
  accountName: string;
  brandColor: string;
  projectId: string;
  projectName: string;
  taskTitle: string;
  status: TaskStatus;
  assigneeId: string;
  assigneeName: string;
  startDate: string;
  dueDate: string;
  estimatedHours: number;
  description: string;
  deliveryTimeliness: DeliveryTimeliness;
  complianceStatus: ComplianceStatus;
  notes: string;
}

type TaskStatus = "PENDING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "BLOCKED";

type EditableCol = "taskTitle" | "status" | "assigneeId" | "startDate" | "dueDate" | "estimatedHours";

const STATUS_CONFIG: Record<TaskStatus, { label: string; bg: string; text: string }> = {
  PENDING:      { label: "Backlog",     bg: "var(--tag-amber-bg)",  text: "var(--tag-amber-text)" },
  IN_PROGRESS:  { label: "En Progreso", bg: "var(--tag-blue-bg)",   text: "var(--tag-blue-text)" },
  REVIEW:       { label: "Revisión",    bg: "var(--tag-purple-bg)", text: "var(--tag-purple-text)" },
  COMPLETED:    { label: "Completado",  bg: "var(--tag-green-bg)",  text: "var(--tag-green-text)" },
  BLOCKED:      { label: "Issues",      bg: "var(--tag-rose-bg)",   text: "var(--tag-rose-text)" },
};

const STATUS_LIST: TaskStatus[] = ["PENDING", "IN_PROGRESS", "REVIEW", "COMPLETED", "BLOCKED"];

const BRAND_COLORS = [
  "#0EA5E9", "#8B5CF6", "#10B981", "#F59E0B", "#F43F5E",
  "#3B82F6", "#EC4899", "#14B8A6", "#F97316", "#6366F1",
];

const CELL_COLS: EditableCol[] = ["taskTitle", "status", "assigneeId", "startDate", "dueDate", "estimatedHours"];

function toISODate(d: string | null): string {
  if (!d) return "";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

function daysUntil(d: string): number {
  if (!d) return Infinity;
  const diff = new Date(d).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function nextCol(col: EditableCol): EditableCol | null {
  const idx = CELL_COLS.indexOf(col);
  return idx < CELL_COLS.length - 1 ? CELL_COLS[idx + 1] : null;
}

interface TrafficTableProps {
  filterAgencyId?: string;
  filterAccountId?: string;
  filterProjectId?: string;
  onRowsLoaded?: (rows: TrafficRow[]) => void;
  isDirector?: boolean;
}

export function TrafficTable({ filterAgencyId, filterAccountId, filterProjectId, onRowsLoaded, isDirector }: TrafficTableProps) {
  const supabase = createClient();

  const [rows, setRows] = useState<TrafficRow[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");

  const [editing, setEditing] = useState<{ row: string; col: EditableCol } | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const profileMap = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [tasksRes, profilesRes, agenciesRes, accountsRes] = await Promise.all([
      supabase.from("tasks").select(`
        id, title, status, start_date, due_date, estimated_hours, assignee_id,
        description, delivery_timeliness, compliance_status, notes,
        project_id, projects!inner(id, name, account_id,
          accounts!inner(id, name, agency_id, agencies!inner(id, name))
        )
      `),
      supabase.from("profiles").select("id, full_name, avatar_url"),
      supabase.from("agencies").select("id, name"),
      supabase.from("accounts").select("id, name, agency_id"),
    ]);

    if (profilesRes.data) setProfiles(profilesRes.data);
    if (agenciesRes.data) setAgencies(agenciesRes.data);
    if (accountsRes.data) setAccounts(accountsRes.data);

    const pm = new Map((profilesRes.data || []).map((p) => [p.id, p]));
    const acList = accountsRes.data || [];

    if (tasksRes.data) {
      const mapped: TrafficRow[] = tasksRes.data.map((t, i) => {
        const assignee = pm.get(t.assignee_id);
        const project = (t as Record<string, unknown>).projects as Record<string, unknown> | undefined;
        const account = project?.accounts as Record<string, unknown> | undefined;
        const agency = account?.agencies as Record<string, unknown> | undefined;
        const accountIdx = acList.findIndex((a) => a.id === (account?.id as string));
        return {
          id: t.id,
          idx: i + 1,
          agencyId: (agency?.id as string) || "",
          agencyName: (agency?.name as string) || "",
          accountId: (account?.id as string) || "",
          accountName: (account?.name as string) || "",
          brandColor: BRAND_COLORS[accountIdx >= 0 ? accountIdx % BRAND_COLORS.length : i % BRAND_COLORS.length],
          projectId: t.project_id,
          projectName: (project?.name as string) || "",
          taskTitle: t.title,
          status: (t.status as TaskStatus) || "PENDING",
          assigneeId: t.assignee_id || "",
          assigneeName: assignee?.full_name || "",
          startDate: toISODate(t.start_date),
          dueDate: toISODate(t.due_date),
          estimatedHours: Number(t.estimated_hours) || 0,
          description: (t.description as string) || "",
          deliveryTimeliness: (t.delivery_timeliness as DeliveryTimeliness) || "UNKNOWN",
          complianceStatus: (t.compliance_status as ComplianceStatus) || "UNKNOWN",
          notes: (t.notes as string) || "",
        };
      });
      setRows(mapped);
      if (onRowsLoaded) onRowsLoaded(mapped);
    }

    setLoading(false);
  }, [supabase, onRowsLoaded]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredRows = useMemo(() => rows.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      if (!r.taskTitle.toLowerCase().includes(q) && !r.accountName.toLowerCase().includes(q) && !r.projectName.toLowerCase().includes(q) && !r.assigneeName.toLowerCase().includes(q)) return false;
    }
    if (filterAgencyId && r.agencyId !== filterAgencyId) return false;
    if (filterAccountId && r.accountId !== filterAccountId) return false;
    if (filterProjectId && r.projectId !== filterProjectId) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterAssignee && r.assigneeId !== filterAssignee) return false;
    return true;
  }), [rows, search, filterAgencyId, filterAccountId, filterProjectId, filterStatus, filterAssignee]);

  const totalHours = useMemo(() => filteredRows.reduce((s, r) => s + r.estimatedHours, 0), [filteredRows]);

  const optimisticUpdate = useCallback((rowId: string, col: EditableCol, value: string) => {
    setRows((prev) => prev.map((r) => {
      if (r.id !== rowId) return r;
      const updated = { ...r };
      switch (col) {
        case "taskTitle": updated.taskTitle = value; break;
        case "status": updated.status = value as TaskStatus; break;
        case "assigneeId":
          updated.assigneeId = value;
          updated.assigneeName = profileMap.get(value)?.full_name || "";
          break;
        case "startDate": updated.startDate = value; break;
        case "dueDate": updated.dueDate = value; break;
        case "estimatedHours": updated.estimatedHours = Number(value) || 0; break;
      }
      return updated;
    }));
  }, [profileMap]);

  const persistUpdate = useCallback(async (rowId: string, col: EditableCol, value: string) => {
    const t0 = performance.now();
    const dbMap: Partial<Record<EditableCol, { column: string; value: string | number | null }>> = {
      taskTitle:       { column: "title", value },
      status:          { column: "status", value },
      assigneeId:      { column: "assignee_id", value: value || null },
      startDate:       { column: "start_date", value: value || null },
      dueDate:         { column: "due_date", value: value || null },
      estimatedHours:  { column: "estimated_hours", value: Number(value) || 0 },
    };
    const mapping = dbMap[col];
    if (mapping) {
      await supabase.from("tasks").update({ [mapping.column]: mapping.value }).eq("id", rowId);
      trackCellUpdate({ taskId: rowId, field: col, value: String(mapping.value), durationMs: performance.now() - t0 });
    }
  }, [supabase]);

  const startEdit = useCallback((rowId: string, col: EditableCol, currentValue: string) => {
    setEditing({ row: rowId, col });
    setEditValue(currentValue);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const commitEdit = useCallback(() => {
    if (!editing) return;
    const { row: rowId, col } = editing;
    optimisticUpdate(rowId, col, editValue);
    persistUpdate(rowId, col, editValue);
    setEditing(null);
  }, [editing, editValue, optimisticUpdate, persistUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, rowId: string, col: EditableCol) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
      const nc = nextCol(col);
      if (nc) startEdit(rowId, nc, rows.find((r) => r.id === rowId)?.[nc === "estimatedHours" ? "estimatedHours" : nc] !== undefined ? String(rows.find((r) => r.id === rowId)![nc === "estimatedHours" ? "estimatedHours" : nc]) : "");
    }
    if (e.key === "Tab") {
      e.preventDefault();
      commitEdit();
      const nc = nextCol(col);
      if (nc) {
        const val = rows.find((r) => r.id === rowId);
        if (val) {
          const raw = val[nc === "estimatedHours" ? "estimatedHours" : nc];
          startEdit(rowId, nc, String(raw ?? ""));
        }
      }
    }
    if (e.key === "Escape") setEditing(null);
  }, [commitEdit, startEdit, rows]);

  const toggleExpand = useCallback((rowId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId); else next.add(rowId);
      return next;
    });
  }, []);

  const handleDetailSave = useCallback((rowId: string, updated: { description: string; deliveryTimeliness: DeliveryTimeliness; complianceStatus: ComplianceStatus; notes: string }) => {
    setRows((prev) => prev.map((r) => r.id === rowId ? { ...r, ...updated } : r));
  }, []);

  const addNewRow = useCallback(async () => {
    const { data } = await supabase
      .from("tasks")
      .insert({ title: "Nueva tarea", status: "PENDING" })
      .select("id")
      .single();

    if (data) {
      trackQuickCreate({ taskId: data.id });
      const newRow: TrafficRow = {
        id: data.id,
        idx: rows.length + 1,
        agencyId: "",
        agencyName: "",
        accountId: "",
        accountName: "",
        brandColor: BRAND_COLORS[rows.length % BRAND_COLORS.length],
        projectId: "",
        projectName: "",
        taskTitle: "Nueva tarea",
        status: "PENDING",
        assigneeId: "",
        assigneeName: "",
        startDate: "",
        dueDate: "",
        estimatedHours: 0,
        description: "",
        deliveryTimeliness: "UNKNOWN",
        complianceStatus: "UNKNOWN",
        notes: "",
      };
      setRows((prev) => [...prev, newRow]);
      setEditing({ row: data.id, col: "taskTitle" });
      setEditValue("Nueva tarea");
    }
  }, [supabase, rows.length]);

  const deleteRow = useCallback(async (rowId: string) => {
    optimisticUpdate(rowId, "taskTitle", "");
    setRows((prev) => prev.filter((r) => r.id !== rowId));
    await supabase.from("tasks").delete().eq("id", rowId);
  }, [supabase, optimisticUpdate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid" style={{ borderColor: "var(--accent-cyan)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Toolbar */}
      <div className="flex items-center gap-3 py-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Buscar tarea, cuenta, proyecto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none transition-all"
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
          />
        </div>

        <FilterSelect value={filterStatus} onChange={setFilterStatus} placeholder="Estados">
          {STATUS_LIST.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </FilterSelect>

        <FilterSelect value={filterAssignee} onChange={setFilterAssignee} placeholder="Asignados">
          {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
        </FilterSelect>

        <button
          onClick={addNewRow}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all ml-auto hover:opacity-90 active:scale-95"
          style={{ background: "var(--accent-green)" }}
        >
          <Plus size={16} />
          <span>Nueva Tarea</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid var(--border)" }}>
        <table className="w-full min-w-[960px]" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: "var(--table-header-bg)" }}>
              <Th style={{ width: 36 }} />
              <Th style={{ width: 36 }}>#</Th>
              <Th>Agencia / Cuenta</Th>
              <Th style={{ minWidth: 180 }}>Tarea</Th>
              <Th style={{ width: 120 }}>Estado</Th>
              <Th style={{ width: 140 }}>Responsable</Th>
              <Th style={{ width: 110 }}>Inicio</Th>
              <Th style={{ width: 110 }}>Entrega</Th>
              <Th style={{ width: 72 }}>Hrs</Th>
              <Th style={{ width: 36 }} />
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <TrafficTableRow
                key={row.id}
                row={row}
                editing={editing}
                editValue={editValue}
                profileMap={profileMap}
                inputRef={inputRef}
                onStartEdit={startEdit}
                onChangeValue={setEditValue}
                onKeyDown={handleKeyDown}
                onCommit={commitEdit}
                onCancel={() => setEditing(null)}
                onDelete={deleteRow}
                isExpanded={expandedRows.has(row.id)}
                onToggleExpand={toggleExpand}
                isDirector={isDirector}
                onDetailSave={handleDetailSave}
              />
            ))}

            {/* Persistent empty row */}
            <tr
              className="cursor-pointer group"
              style={{ borderTop: "1px solid var(--divider)", background: "var(--card-bg)" }}
              onClick={addNewRow}
            >
              <td /><td className="p-2 text-center"><Plus size={14} className="mx-auto" style={{ color: "var(--text-muted)" }} /></td>
              <td className="p-2"><span className="text-xs" style={{ color: "var(--text-muted)" }}>Click para agregar tarea...</span></td>
              <td /><td /><td /><td /><td /><td /><td />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
        <span>{filteredRows.length} de {rows.length} tareas</span>
        <div className="flex items-center gap-3">
          <span>{totalHours}h estimadas</span>
          <span>{filteredRows.filter((r) => r.status === "BLOCKED").length} bloqueadas</span>
          <span>{filteredRows.filter((r) => { const d = daysUntil(r.dueDate); return d <= 2 && d >= 0; }).length} urgentes</span>
        </div>
      </div>
    </div>
  );
}

function TrafficTableRow({
  row, editing, editValue, profileMap, inputRef,
  onStartEdit, onChangeValue, onKeyDown, onCommit, onCancel, onDelete,
  isExpanded, onToggleExpand, isDirector, onDetailSave,
}: {
  row: TrafficRow;
  editing: { row: string; col: EditableCol } | null;
  editValue: string;
  profileMap: Map<string, Profile>;
  inputRef: React.RefObject<HTMLInputElement | HTMLSelectElement | null>;
  onStartEdit: (rowId: string, col: EditableCol, val: string) => void;
  onChangeValue: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent, rowId: string, col: EditableCol) => void;
  onCommit: () => void;
  onCancel: () => void;
  onDelete: (rowId: string) => void;
  isExpanded: boolean;
  onToggleExpand: (rowId: string) => void;
  isDirector?: boolean;
  onDetailSave: (rowId: string, updated: { description: string; deliveryTimeliness: DeliveryTimeliness; complianceStatus: ComplianceStatus; notes: string }) => void;
}) {
  const st = STATUS_CONFIG[row.status] || STATUS_CONFIG.PENDING;
  const dueDays = daysUntil(row.dueDate);
  const isUrgent = dueDays <= 2 && dueDays >= 0;
  const isOverdue = dueDays < 0;
  const isEditing = (col: EditableCol) => editing?.row === row.id && editing?.col === col;

  return (
    <>
      <tr
        className="group transition-colors"
        style={{ background: "var(--card-bg)", borderTop: "1px solid var(--divider)" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--table-row-hover)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--card-bg)"; }}
      >
        {/* Expand */}
        <td className="p-2 text-center">
          <button
            onClick={() => onToggleExpand(row.id)}
            className="p-0.5 rounded transition-all hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </td>

        {/* # */}
        <td className="p-2 text-center">
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{row.idx}</span>
        </td>

        {/* Agency / Account */}
        <td className="p-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: row.brandColor }} />
            <div className="min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{row.agencyName || "\u2014"}</div>
              <div className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{row.accountName || "\u2014"}</div>
            </div>
          </div>
        </td>

        {/* Task Title */}
        <td className="p-2">
          {isEditing("taskTitle") ? (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={editValue}
              onChange={(e) => onChangeValue(e.target.value)}
              onKeyDown={(e) => onKeyDown(e, row.id, "taskTitle")}
              onBlur={onCommit}
              className="w-full px-2 py-1 rounded text-sm outline-none"
              style={{ background: "var(--input-bg)", border: "1px solid var(--accent-cyan)", color: "var(--text-primary)" }}
              autoFocus
            />
          ) : (
            <div
              className="text-sm cursor-pointer px-1 py-0.5 rounded transition-colors hover:bg-[var(--table-row-hover)]"
              style={{ color: "var(--text-primary)" }}
              onClick={() => onStartEdit(row.id, "taskTitle", row.taskTitle)}
            >
              {row.taskTitle}
            </div>
          )}
        </td>

        {/* Status */}
        <td className="p-2">
          {isEditing("status") ? (
            <select
              ref={inputRef as React.RefObject<HTMLSelectElement>}
              value={editValue}
              onChange={(e) => { onChangeValue(e.target.value); }}
              onBlur={onCommit}
              onKeyDown={(e) => onKeyDown(e, row.id, "status")}
              className="w-full px-2 py-1 rounded text-xs font-medium outline-none cursor-pointer"
              style={{ background: "var(--input-bg)", border: "1px solid var(--accent-cyan)", color: "var(--text-primary)" }}
              autoFocus
            >
              {STATUS_LIST.map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          ) : (
            <span
              className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-opacity hover:opacity-80"
              style={{ background: st.bg, color: st.text }}
              onClick={() => onStartEdit(row.id, "status", row.status)}
            >
              {st.label}
            </span>
          )}
        </td>

        {/* Assignee */}
        <td className="p-2">
          {isEditing("assigneeId") ? (
            <select
              ref={inputRef as React.RefObject<HTMLSelectElement>}
              value={editValue}
              onChange={(e) => onChangeValue(e.target.value)}
              onBlur={onCommit}
              onKeyDown={(e) => onKeyDown(e, row.id, "assigneeId")}
              className="w-full px-2 py-1 rounded text-xs outline-none"
              style={{ background: "var(--input-bg)", border: "1px solid var(--accent-cyan)", color: "var(--text-primary)" }}
              autoFocus
            >
              <option value="">Sin asignar</option>
              {Array.from(profileMap.values()).map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          ) : (
            <div
              className="flex items-center gap-1.5 cursor-pointer px-1 py-0.5 rounded transition-colors hover:bg-[var(--table-row-hover)]"
              onClick={() => onStartEdit(row.id, "assigneeId", row.assigneeId)}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium shrink-0"
                style={{
                  background: row.assigneeId ? "var(--accordion-bg)" : "var(--divider)",
                  color: row.assigneeId ? "var(--text-secondary)" : "var(--text-muted)",
                  border: "1px solid var(--border)",
                }}
              >
                {row.assigneeName ? row.assigneeName.charAt(0).toUpperCase() : "?"}
              </div>
              <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                {row.assigneeName || "Sin asignar"}
              </span>
            </div>
          )}
        </td>

        {/* Start Date */}
        <td className="p-2">
          {isEditing("startDate") ? (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="date"
              value={editValue}
              onChange={(e) => onChangeValue(e.target.value)}
              onBlur={onCommit}
              onKeyDown={(e) => onKeyDown(e, row.id, "startDate")}
              className="w-full px-2 py-1 rounded text-xs outline-none"
              style={{ background: "var(--input-bg)", border: "1px solid var(--accent-cyan)", color: "var(--text-primary)" }}
              autoFocus
            />
          ) : (
            <div
              className="flex items-center gap-1 cursor-pointer px-1 py-0.5 rounded transition-colors hover:bg-[var(--table-row-hover)]"
              onClick={() => onStartEdit(row.id, "startDate", row.startDate)}
            >
              <Calendar size={11} style={{ color: "var(--text-muted)" }} />
              <span className="text-xs" style={{ color: row.startDate ? "var(--text-primary)" : "var(--text-muted)" }}>
                {row.startDate || "\u2014"}
              </span>
            </div>
          )}
        </td>

        {/* Due Date */}
        <td className="p-2">
          {isEditing("dueDate") ? (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="date"
              value={editValue}
              onChange={(e) => onChangeValue(e.target.value)}
              onBlur={onCommit}
              onKeyDown={(e) => onKeyDown(e, row.id, "dueDate")}
              className="w-full px-2 py-1 rounded text-xs outline-none"
              style={{ background: "var(--input-bg)", border: "1px solid var(--accent-cyan)", color: "var(--text-primary)" }}
              autoFocus
            />
          ) : (
            <div
              className="flex items-center gap-1 cursor-pointer px-1 py-0.5 rounded transition-colors hover:bg-[var(--table-row-hover)]"
              onClick={() => onStartEdit(row.id, "dueDate", row.dueDate)}
              style={{ color: isOverdue ? "var(--accent-rose)" : isUrgent ? "var(--accent-amber)" : "var(--text-primary)" }}
            >
              <Clock size={11} style={{ color: isOverdue || isUrgent ? "inherit" : "var(--text-muted)" }} />
              <span className="text-xs font-medium">{row.dueDate || "\u2014"}</span>
              {isOverdue && <span className="text-[10px] font-semibold" style={{ color: "var(--accent-rose)" }}>({Math.abs(dueDays)}d)</span>}
              {isUrgent && !isOverdue && <span className="text-[10px] font-semibold" style={{ color: "var(--accent-amber)" }}>({dueDays}d)</span>}
            </div>
          )}
        </td>

        {/* Hours */}
        <td className="p-2">
          {isEditing("estimatedHours") ? (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="number"
              value={editValue}
              onChange={(e) => onChangeValue(e.target.value)}
              onBlur={onCommit}
              onKeyDown={(e) => onKeyDown(e, row.id, "estimatedHours")}
              className="w-14 px-1 py-1 rounded text-xs outline-none text-center"
              style={{ background: "var(--input-bg)", border: "1px solid var(--accent-cyan)", color: "var(--text-primary)" }}
              autoFocus
              min="0"
              step="0.5"
            />
          ) : (
            <div
              className="text-xs font-medium text-center cursor-pointer px-1 py-0.5 rounded transition-colors hover:bg-[var(--table-row-hover)]"
              style={{ color: "var(--text-secondary)" }}
              onClick={() => onStartEdit(row.id, "estimatedHours", String(row.estimatedHours))}
            >
              {row.estimatedHours > 0 ? `${row.estimatedHours}h` : "\u2014"}
            </div>
          )}
        </td>

        {/* Delete */}
        <td className="p-2">
          <button
            onClick={() => onDelete(row.id)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
            title="Eliminar"
          >
            <X size={14} />
          </button>
        </td>
      </tr>

      {/* Expanded Detail */}
      {isExpanded && (
        <TaskDetailPanel
          data={{
            taskId: row.id,
            description: row.description,
            deliveryTimeliness: row.deliveryTimeliness,
            complianceStatus: row.complianceStatus,
            notes: row.notes,
          }}
          isDirector={!!isDirector}
          onSave={(updated) => onDetailSave(row.id, updated)}
        />
      )}
    </>
  );
}

function FilterSelect({ value, onChange, placeholder, children }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 rounded-lg text-sm outline-none"
      style={{ background: "var(--card-bg)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  );
}

function Th({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <th
      className="p-2 text-left text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap"
      style={{ color: "var(--text-muted)", ...style }}
    >
      {children}
    </th>
  );
}
