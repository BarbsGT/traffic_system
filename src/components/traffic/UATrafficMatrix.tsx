"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { isTaskRedAlert, isProjectRedStatus } from "@/utils/taskAlerts";
import {
  Search, Plus, ChevronDown, ChevronRight, ExternalLink, FileText,
  MessageSquare, X, Eye, EyeOff, Lock, LockOpen,
} from "lucide-react";

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
  brief_link: string;
  decks_link: string;
  team_notes: string;
  delivered_at: string;
}

interface UATask {
  id: string;
  project_id: string;
  title: string;
  description: string;
  assignee_id: string | null;
  status: string;
  priority: string;
  start_date: string;
  due_date: string;
  delivered_at: string | null;
}

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
}

interface UATaskComment {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

type EditableCol = keyof Omit<UARow, "id" | "account_id">;

interface EditingState {
  row: string;
  col: EditableCol;
}

interface ColumnDef {
  key: EditableCol | "actions";
  label: string;
  width: string;
  defaultVisible: boolean;
}

const AREAS = ["Special Projects", "Social media", "Paid media", "Marketing Ops"];
const TIERS = ["Gold", "Silver", "Bronze"];
const CREATIVE_STATUSES = ["Approved", "On Hold", "Pending Client", "In Progress", "Send", "Ajustes", "To do"];
const TASK_STATUSES = ["PENDING", "IN_PROGRESS", "REVIEW", "COMPLETED", "BLOCKED"];
const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const PRIORITY_STYLE: Record<string, { bg: string; text: string }> = {
  LOW: { bg: "rgba(148,163,184,0.15)", text: "var(--text-muted)" },
  MEDIUM: { bg: "rgba(14,165,233,0.12)", text: "var(--accent-cyan)" },
  HIGH: { bg: "rgba(245,158,11,0.15)", text: "var(--accent-amber)" },
  URGENT: { bg: "rgba(244,63,94,0.15)", text: "var(--accent-rose)" },
};

const TASK_STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "rgba(245,158,11,0.22)", text: "var(--accent-amber)" },
  IN_PROGRESS: { bg: "rgba(14,165,233,0.22)", text: "var(--accent-cyan)" },
  REVIEW: { bg: "rgba(139,92,246,0.22)", text: "var(--accent-purple)" },
  COMPLETED: { bg: "rgba(16,185,129,0.22)", text: "var(--accent-green)" },
  BLOCKED: { bg: "rgba(244,63,94,0.22)", text: "var(--accent-rose)" },
};

const TIER_STYLE: Record<string, { bg: string; text: string }> = {
  Gold: { bg: "rgba(245,158,11,0.15)", text: "rgb(217,119,6)" },
  Silver: { bg: "rgba(148,163,184,0.2)", text: "rgb(100,116,139)" },
  Bronze: { bg: "rgba(180,83,9,0.12)", text: "rgb(146,64,14)" },
};

const AREA_COLORS: Record<string, string> = {
  "Special Projects": "rgb(139,92,246)",
  "Social media": "rgb(14,165,233)",
  "Paid media": "rgb(16,185,129)",
  "Marketing Ops": "rgb(245,158,11)",
};

function formatDate(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toDateInput(d: string) {
  return d ? d.substring(0, 10) : "";
}

function computeWorkingDays(start: string, end: string) {
  if (!start || !end) return 0;
  let count = 0;
  const cur = new Date(start);
  const e = new Date(end);
  while (cur <= e) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function getInitials(name: string) {
  if (!name) return "?";
  return name.split(" ").map((s) => s[0]).join("").toUpperCase().slice(0, 2);
}

function daysRemaining(dateStr: string) {
  if (!dateStr) return null;
  const now = new Date();
  const target = new Date(dateStr);
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function deadlineInfo(row: UARow): { label: string; overdue: boolean } {
  if (!row.end_date) return { label: "—", overdue: false };
  if (row.delivered_at) {
    const delivered = new Date(row.delivered_at);
    const end = new Date(row.end_date);
    const diff = Math.ceil((delivered.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));
    if (diff > 0) return { label: `${diff}d ret`, overdue: true };
    if (diff === 0) return { label: "A tiempo", overdue: false };
    return { label: `${Math.abs(diff)}d antes`, overdue: false };
  }
  if (row.creative_status === "Approved" || row.creative_status === "Send" || !isProjectRedStatus(row.creative_status)) {
    return { label: "A tiempo", overdue: false };
  }
  const days = daysRemaining(row.end_date);
  if (days !== null && days < 0) return { label: `${Math.abs(days)}d ret`, overdue: true };
  return { label: `${days}d`, overdue: false };
}

function getUniqueClientOwners(data: UARow[]): string[] {
  return [...new Set(data.map((r) => r.client_owner).filter(Boolean))].sort();
}

interface Props {
  accountId: string;
  disableSearch?: boolean;
}

export function UATrafficMatrix({ accountId, disableSearch = false }: Props) {
  const [rows, setRows] = useState<UARow[]>([]);
  const [tasks, setTasks] = useState<Record<string, UATask[]>>({});
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [search, setSearch] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterTier, setFilterTier] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [taskComments, setTaskComments] = useState<Record<string, UATaskComment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [newTaskForm, setNewTaskForm] = useState<Record<string, { title: string; description: string; priority: string; assignee_id: string; start_date: string; due_date: string }>>({});
  const [drawerProject, setDrawerProject] = useState<UARow | null>(null);
  const [notesPopover, setNotesPopover] = useState<string | null>(null);
  const [notesEditValue, setNotesEditValue] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    project_name: "", client_owner: "", area: "", tier: "", budget: "", brief_date: "",
    resp_bt: "", end_date: "", launch_date: "", presentation_date: "",
    creative_status: "To do", status_btlive: "", status_migrante: "",
    brief_link: "", decks_link: "", team_notes: "",
  });
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [deliveryModal, setDeliveryModal] = useState<{
    kind: "project" | "task";
    id: string;
    projectId: string;
    nextStatus: string;
    taskTitle?: string;
  } | null>(null);
  const [deliveryDate, setDeliveryDate] = useState("");

  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const newRowRef = useRef<HTMLTableRowElement>(null);
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const ALL_COLUMNS: ColumnDef[] = [
    { key: "project_name", label: "PROYECTO", width: "220px", defaultVisible: true },
    { key: "budget", label: "BUDGET", width: "90px", defaultVisible: true },
    { key: "brief_date", label: "BRIEF", width: "75px", defaultVisible: true },
    { key: "end_date", label: "DEADLINE", width: "110px", defaultVisible: true },
    { key: "creative_status", label: "STATUS", width: "100px", defaultVisible: true },
    { key: "launch_date", label: "LANZAM.", width: "75px", defaultVisible: true },
    { key: "presentation_date", label: "PRESENT.", width: "75px", defaultVisible: false },
    { key: "status_btlive", label: "BTL", width: "55px", defaultVisible: false },
    { key: "status_migrante", label: "MIG", width: "60px", defaultVisible: false },
    { key: "actions", label: "ACCIÓN", width: "90px", defaultVisible: true },
  ];

  const visibleColumns = useMemo(() => {
    return ALL_COLUMNS.filter((c) => columnVisibility[c.key] ?? c.defaultVisible);
  }, [columnVisibility]);

  const blockedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const projectById = new Map(rows.map((r) => [r.id, r]));
    Object.entries(tasks).forEach(([projectId, list]) => {
      const project = projectById.get(projectId);
      counts[projectId] = list.filter((t) => isTaskRedAlert(t.status, project)).length;
    });
    return counts;
  }, [tasks, rows]);

  useEffect(() => {
    if (!accountId) return;
    (async () => {
      const [projectsResult, meRes] = await Promise.all([
        supabase.from("projects").select("*").eq("type", "ua_traffic").eq("account_id", accountId).order("created_at", { ascending: false }),
        supabase.auth.getUser(),
      ]);
      const raw = (projectsResult.data as any[]) || [];
      setRows(raw.map((r) => ({ ...r, project_name: r.name })) as UARow[]);

      const projectIds = raw.map((r) => r.id);
      if (projectIds.length > 0) {
        const { data: allTasks } = await supabase
          .from("tasks")
          .select("*")
          .in("project_id", projectIds);
        if (allTasks) {
          const grouped: Record<string, UATask[]> = {};
          (allTasks as UATask[]).forEach((t) => {
            (grouped[t.project_id] = grouped[t.project_id] || []).push(t);
          });
          setTasks(grouped);
        }
      }

      const myRole = meRes.data?.user?.id
        ? (await supabase.from("profiles").select("role").eq("id", meRes.data.user.id).single()).data?.role
        : null;

      if ((myRole === "DIRECTOR" || myRole === "GERENTE") && meRes.data?.user?.id) {
        const [{ data: myAccounts }, { data: managedAccounts }] = await Promise.all([
          supabase.from("profile_accounts").select("account_id").eq("profile_id", meRes.data.user.id),
          supabase.from("profile_accounts").select("account_id").eq("manager_id", meRes.data.user.id),
        ]);
        const accountIds = [...new Set([
          ...(myAccounts?.map((a) => a.account_id) || []),
          ...(managedAccounts?.map((a) => a.account_id) || []),
        ])];
        if (accountIds.length > 0) {
          const { data: collaboratorIds } = await supabase
            .from("profile_accounts")
            .select("profile_id")
            .in("account_id", accountIds);
          const cids = [...new Set(collaboratorIds?.map((c) => c.profile_id) || [])];
          if (cids.length > 0) {
            const { data } = await supabase
              .from("profiles")
              .select("id, full_name, avatar_url")
              .in("id", cids)
              .order("full_name");
            if (data) setProfiles(data as Profile[]);
          } else {
            setProfiles([]);
          }
        } else {
          setProfiles([]);
        }
      } else {
        const { data } = await supabase.from("profiles").select("id, full_name, avatar_url").order("full_name");
        if (data) setProfiles(data as Profile[]);
      }

      setLoading(false);
    })();
  }, [accountId]);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) {
        setShowColumnMenu(false);
      }
    };
    if (showColumnMenu) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showColumnMenu]);

  const clientOwners = useMemo(() => getUniqueClientOwners(rows), [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (search && !r.project_name.toLowerCase().includes(search.toLowerCase()) && !r.client_owner.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterArea && r.area !== filterArea) return false;
      if (filterTier && r.tier !== filterTier) return false;
      if (filterStatus && r.creative_status !== filterStatus) return false;
      return true;
    });
  }, [rows, search, filterArea, filterTier, filterStatus]);

  const loadTasks = useCallback(async (projectId: string) => {
    const { data } = await supabase.from("tasks").select("*").eq("project_id", projectId).order("created_at");
    if (data) setTasks((prev) => ({ ...prev, [projectId]: data as UATask[] }));
  }, []);

  const toggleExpand = (projectId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else { next.add(projectId); if (!tasks[projectId]) loadTasks(projectId); }
      return next;
    });
  };

  const addTask = async (projectId: string) => {
    const form = newTaskForm[projectId] || { title: "", description: "", priority: "MEDIUM", assignee_id: "", start_date: "", due_date: "" };
    if (!form.title.trim()) return;
    setNewTaskForm((prev) => ({ ...prev, [projectId]: { title: "", description: "", priority: "MEDIUM", assignee_id: "", start_date: "", due_date: "" } }));
    const { data, error } = await supabase.from("tasks").insert({
      project_id: projectId, title: form.title.trim(), description: form.description.trim(),
      priority: form.priority, assignee_id: form.assignee_id || null, start_date: form.start_date || null, due_date: form.due_date || null,
    }).select().single();
    if (error) { console.error("Error creando tarea:", JSON.stringify(error)); return; }
    setTasks((prev) => ({ ...prev, [projectId]: [...(prev[projectId] || []), data as UATask] }));
  };

  const assignTask = async (taskId: string, assigneeId: string) => {
    const { error } = await supabase.from("tasks").update({ assignee_id: assigneeId || null }).eq("id", taskId);
    if (error) { console.error("Error asignando:", JSON.stringify(error)); return; }
    setTasks((prev) => { const u = { ...prev }; for (const k of Object.keys(u)) u[k] = u[k].map((t) => (t.id === taskId ? { ...t, assignee_id: assigneeId || null } : t)); return u; });
  };

  const updateTaskStatus = async (taskId: string, status: string, deliveredAt?: string) => {
    const payload: { status: string; completed_at: string | null; delivered_at: string | null } = { status, completed_at: null, delivered_at: null };
    if (status === "COMPLETED") {
      payload.completed_at = new Date().toISOString();
      payload.delivered_at = deliveredAt || new Date().toISOString().slice(0, 10);
    }
    const { error } = await supabase.from("tasks").update(payload).eq("id", taskId);
    if (error && (error.code === "PGRST204" || error.message?.includes("completed_at") || error.message?.includes("delivered_at"))) {
      const { error: e2 } = await supabase.from("tasks").update({ status }).eq("id", taskId);
      if (e2) { console.error("Error actualizando tarea:", JSON.stringify(e2)); return; }
    } else if (error) {
      console.error("Error actualizando tarea:", JSON.stringify(error)); return;
    }
    setTasks((prev) => { const u = { ...prev }; for (const k of Object.keys(u)) u[k] = u[k].map((t) => (t.id === taskId ? { ...t, status, completed_at: status === "COMPLETED" ? payload.completed_at : null, delivered_at: status === "COMPLETED" ? payload.delivered_at : null } : t)); return u; });
  };

  const toggleTaskBlock = async (taskId: string, projectId: string, currentlyBlocked: boolean) => {
    if (currentlyBlocked) {
      const { error } = await supabase.from("tasks").update({ status: "IN_PROGRESS", alert_status: "DESBLOQUEADA" }).eq("id", taskId);
      if (error) { console.error("Error desbloqueando:", JSON.stringify(error)); return; }
      setTasks((prev) => { const u = { ...prev }; for (const k of Object.keys(u)) u[k] = u[k].map((t) => (t.id === taskId ? { ...t, status: "IN_PROGRESS", alert_status: "DESBLOQUEADA" } : t)); return u; });
    } else {
      await updateTaskStatus(taskId, "BLOCKED");
    }
  };

  const updateTaskPriority = async (taskId: string, priority: string) => {
    const { error } = await supabase.from("tasks").update({ priority }).eq("id", taskId);
    if (error) { console.error("Error actualizando prioridad:", JSON.stringify(error)); return; }
    setTasks((prev) => { const u = { ...prev }; for (const k of Object.keys(u)) u[k] = u[k].map((t) => (t.id === taskId ? { ...t, priority } : t)); return u; });
  };

  const updateTaskStartDate = async (taskId: string, startDate: string) => {
    const { error } = await supabase.from("tasks").update({ start_date: startDate || null }).eq("id", taskId);
    if (error) { console.error("Error actualizando fecha inicio:", JSON.stringify(error)); return; }
    setTasks((prev) => { const u = { ...prev }; for (const k of Object.keys(u)) u[k] = u[k].map((t) => (t.id === taskId ? { ...t, start_date: startDate } : t)); return u; });
  };

  const updateTaskDueDate = async (taskId: string, dueDate: string) => {
    const { error } = await supabase.from("tasks").update({ due_date: dueDate || null }).eq("id", taskId);
    if (error) { console.error("Error actualizando fecha:", JSON.stringify(error)); return; }
    setTasks((prev) => { const u = { ...prev }; for (const k of Object.keys(u)) u[k] = u[k].map((t) => (t.id === taskId ? { ...t, due_date: dueDate } : t)); return u; });
  };

  const updateTaskDescription = async (taskId: string, description: string) => {
    const { error } = await supabase.from("tasks").update({ description }).eq("id", taskId);
    if (error) { console.error("Error actualizando descripción:", JSON.stringify(error)); return; }
    setTasks((prev) => { const u = { ...prev }; for (const k of Object.keys(u)) u[k] = u[k].map((t) => (t.id === taskId ? { ...t, description } : t)); return u; });
  };

  const updateTaskTitle = async (taskId: string, title: string) => {
    const { error } = await supabase.from("tasks").update({ title }).eq("id", taskId);
    if (error) { console.error("Error actualizando nombre:", JSON.stringify(error)); return; }
    setTasks((prev) => { const u = { ...prev }; for (const k of Object.keys(u)) u[k] = u[k].map((t) => (t.id === taskId ? { ...t, title } : t)); return u; });
  };

  const loadComments = useCallback(async (taskId: string) => {
    const { data } = await supabase.from("comments").select("*").eq("task_id", taskId).order("created_at");
    if (data) setTaskComments((prev) => ({ ...prev, [taskId]: data as UATaskComment[] }));
  }, []);

  const addComment = async (taskId: string) => {
    const content = commentInputs[taskId]?.trim();
    if (!content) return;
    setCommentInputs((prev) => ({ ...prev, [taskId]: "" }));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const newComment: UATaskComment = { id: crypto.randomUUID(), task_id: taskId, author_id: user.id, content, created_at: new Date().toISOString() };
    const { error } = await supabase.from("comments").insert({ id: newComment.id, task_id: taskId, author_id: user.id, content });
    if (error) { console.error("Error creando comentario:", JSON.stringify(error)); return; }
    setTaskComments((prev) => ({ ...prev, [taskId]: [...(prev[taskId] || []), newComment] }));
  };

  function startEdit(row: string, col: EditableCol) { setEditing({ row, col }); }

  function commitEdit(rowId: string, col: EditableCol, value: string) {
    setEditing(null);
    setRows((prev) => prev.map((r) => {
      if (r.id !== rowId) return r;
      let parsed: string | number = value;
      if (col === "budget") parsed = parseFloat(value) || 0;
      if (col === "working_days") parsed = parseInt(value) || 0;
      const dbCol = col === "project_name" ? "name" : col;
      const updated = { ...r, [col]: parsed };
      if ((col === "brief_date" || col === "end_date") && updated.brief_date && updated.end_date) {
        updated.working_days = computeWorkingDays(updated.brief_date, updated.end_date);
      }
      supabase.from("projects").update({ [dbCol]: parsed }).eq("id", rowId).then(({ error }) => {
        if (error) console.error("Error guardando:", JSON.stringify(error));
      });
      return updated;
    }));
  }

  function cancelEdit() { setEditing(null); }

  const requestDeliveryDate = (kind: "project" | "task", id: string, projectId: string, nextStatus: string, taskTitle?: string) => {
    setDeliveryDate(new Date().toISOString().slice(0, 10));
    setDeliveryModal({ kind, id, projectId, nextStatus, taskTitle });
  };

  const confirmDelivery = async () => {
    if (!deliveryModal) return;
    const { kind, id, nextStatus } = deliveryModal;
    const delivered = deliveryDate || new Date().toISOString().slice(0, 10);
    if (kind === "project") {
      const { error } = await supabase.from("projects").update({ creative_status: nextStatus, delivered_at: delivered }).eq("id", id);
      if (error) { console.error("Error guardando entrega:", JSON.stringify(error)); return; }
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, creative_status: nextStatus, delivered_at: delivered } : r)));
    } else {
      await updateTaskStatus(id, nextStatus, delivered);
    }
    setDeliveryModal(null);
  };

  async function handleCreateProject() {
    if (!createForm.project_name.trim()) return;
    const newId = crypto.randomUUID();
    const payload: Record<string, unknown> = { id: newId, account_id: accountId, creative_status: "To do", type: "ua_traffic" };
    for (const [key, val] of Object.entries(createForm)) {
      if (key === "budget") payload[key] = parseFloat(val) || 0;
      else if (key === "project_name") payload.name = val || null;
      else payload[key] = val || null;
    }
    const { error } = await supabase.from("projects").insert(payload);
    if (error) { console.error("Error creando proyecto:", JSON.stringify(error)); return; }
    const mapped = { ...(payload as unknown as UARow), id: newId, project_name: createForm.project_name, account_id: accountId, budget: parseFloat(createForm.budget) || 0, creative_status: "To do" };
    setRows((prev) => [mapped, ...prev]);
    setShowCreateModal(false);
    setCreateForm({ project_name: "", client_owner: "", area: "", tier: "", budget: "", brief_date: "", resp_bt: "", end_date: "", launch_date: "", presentation_date: "", creative_status: "To do", status_btlive: "", status_migrante: "", brief_link: "", decks_link: "", team_notes: "" });
    setTimeout(() => newRowRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  function openDrawer(row: UARow) { setDrawerProject(row); }
  function closeDrawer() { setDrawerProject(null); }

  function openNotes(row: UARow) {
    setNotesPopover(row.id);
    setNotesEditValue(row.team_notes || "");
    setTimeout(() => notesRef.current?.focus(), 50);
  }

  function saveNotes(rowId: string) {
    const val = notesEditValue.trim();
    commitEdit(rowId, "team_notes", val);
    setNotesPopover(null);
  }

  function renderProjectHero(row: UARow) {
    const tierStyle = TIER_STYLE[row.tier];
    const areaColor = AREA_COLORS[row.area] || "var(--text-muted)";
    const blocked = blockedCounts[row.id] || 0;
    return (
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[12px] font-semibold truncate leading-tight" style={{ color: "var(--text-primary)" }}>
          {row.project_name}
        </span>
        <div className="flex items-center gap-1 flex-wrap">
          {blocked > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); if (!expandedRows.has(row.id)) toggleExpand(row.id); }}
              className="px-1.5 py-0.5 rounded-full text-[9px] font-bold leading-none inline-flex items-center gap-0.5 hover:opacity-80 transition-all"
              style={{ background: "rgba(244,63,94,0.18)", color: "var(--accent-rose)" }}
              title="Tareas en alerta (vencidas o bloqueadas)">
              <Lock size={9} /> {blocked} ALERTA{blocked > 1 ? "S" : ""}
            </button>
          )}
          {row.tier && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold leading-none"
              style={{ background: tierStyle?.bg, color: tierStyle?.text }}>
              {row.tier}
            </span>
          )}
          {row.area && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium leading-none"
              style={{ background: `${areaColor}20`, color: areaColor }}>
              {row.area}
            </span>
          )}
          {row.client_owner && (
            <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>
              {row.client_owner}
            </span>
          )}
        </div>
      </div>
    );
  }

  function renderDeadline(row: UARow) {
    const info = deadlineInfo(row);
    const isOverdue = info.overdue;
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-mono" style={{ color: isOverdue ? "var(--accent-rose)" : "var(--text-primary)" }}>
          {formatDate(row.end_date) || "—"}
        </span>
        {info.label !== "—" && (
          <span className={`px-1 py-0.5 rounded text-[9px] font-semibold leading-none ${isOverdue ? "" : ""}`}
            style={{
              background: isOverdue ? "rgba(244,63,94,0.15)" : "rgba(148,163,184,0.15)",
              color: isOverdue ? "rgb(244,63,94)" : "var(--text-muted)",
            }}>
            {info.label}
          </span>
        )}
      </div>
    );
  }

  function renderActions(row: UARow) {
    return (
      <div className="flex items-center gap-1">
        {row.brief_link && (
          <a href={row.brief_link} target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded hover:opacity-70 transition-all"
            style={{ color: "var(--text-muted)" }} title="Brief">
            <FileText size={13} />
          </a>
        )}
        {row.decks_link && (
          <a href={row.decks_link} target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded hover:opacity-70 transition-all"
            style={{ color: "var(--text-muted)" }} title="Decks">
            <ExternalLink size={13} />
          </a>
        )}
        <button onClick={(e) => { e.stopPropagation(); openNotes(row); }}
          className="p-1 rounded hover:opacity-70 transition-all relative"
          style={{ color: row.team_notes ? "var(--accent-amber)" : "var(--text-muted)" }} title="Notas">
          <MessageSquare size={13} />
          {row.team_notes && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: "var(--accent-amber)" }} />
          )}
        </button>
        <button onClick={(e) => { e.stopPropagation(); openDrawer(row); }}
          className="p-1 rounded hover:opacity-70 transition-all"
          style={{ color: "var(--accent-cyan)" }} title="Ver detalle">
          <ChevronRight size={13} />
        </button>
      </div>
    );
  }

  function renderCell(row: UARow, colKey: string) {
    if (colKey === "actions") return renderActions(row);

    const col = colKey as EditableCol;
    const isEditing = editing?.row === row.id && editing?.col === col;

    if (colKey === "project_name") {
      if (isEditing) {
        return (
          <input ref={inputRef as React.Ref<HTMLInputElement>} type="text" defaultValue={row.project_name}
            onBlur={(e) => { if (e.target.value !== row.project_name) commitEdit(row.id, "project_name", e.target.value); else cancelEdit(); }}
            onKeyDown={(e) => { if (e.key === "Enter") commitEdit(row.id, "project_name", (e.target as HTMLInputElement).value); if (e.key === "Escape") cancelEdit(); }}
            autoFocus
            className="w-full px-1 py-0.5 rounded text-[11px] outline-none"
            style={{ background: "var(--input-bg)", border: "1px solid var(--accent-cyan)", color: "var(--text-primary)" }} />
        );
      }
      return renderProjectHero(row);
    }

    if (colKey === "end_date") {
      if (isEditing) {
        return (
          <input ref={inputRef as React.Ref<HTMLInputElement>} type="date" defaultValue={toDateInput(row.end_date)}
            onBlur={(e) => commitEdit(row.id, "end_date", e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") commitEdit(row.id, "end_date", (e.target as HTMLInputElement).value); if (e.key === "Escape") cancelEdit(); }}
            autoFocus
            className="w-full px-1 py-0.5 rounded text-[11px] outline-none"
            style={{ background: "var(--input-bg)", border: "1px solid var(--accent-cyan)", color: "var(--text-primary)" }} />
        );
      }
      return renderDeadline(row);
    }

    const val = row[col];
    const strVal = String(val ?? "");

    if (col === "creative_status") {
      if (isEditing) {
        return (
          <select ref={inputRef as React.Ref<HTMLSelectElement>} defaultValue={strVal}
            onChange={(e) => {
              const next = e.target.value;
              if (next !== strVal && (next === "Approved" || next === "Send")) {
                requestDeliveryDate("project", row.id, row.id, next);
              } else {
                commitEdit(row.id, col, next);
              }
            }}
            onBlur={(e) => { if (e.currentTarget.value !== strVal) commitEdit(row.id, col, e.currentTarget.value); else cancelEdit(); }}
            autoFocus
            className="w-full px-1 py-0.5 rounded text-[11px] outline-none"
            style={{ background: "var(--input-bg)", border: "1px solid var(--accent-cyan)", color: "var(--text-primary)" }}>
            {CREATIVE_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        );
      }
      const isRed = isProjectRedStatus(strVal);
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
          style={{
            background: isRed ? "rgba(244,63,94,0.15)" : "var(--card-bg)",
            color: isRed ? "rgb(244,63,94)" : "var(--text-muted)",
          }}>
          {strVal || "—"}
        </span>
      );
    }

    if (col === "budget") {
      const num = Number(val) || 0;
      if (isEditing) {
        return (
          <input ref={inputRef as React.Ref<HTMLInputElement>} type="number" defaultValue={num || ""}
            onBlur={(e) => { if (e.target.value !== String(num)) commitEdit(row.id, col, e.target.value); else cancelEdit(); }}
            onKeyDown={(e) => { if (e.key === "Enter") commitEdit(row.id, col, (e.target as HTMLInputElement).value); if (e.key === "Escape") cancelEdit(); }}
            autoFocus
            className="w-full px-1 py-0.5 rounded text-[11px] outline-none"
            style={{ background: "var(--input-bg)", border: "1px solid var(--accent-cyan)", color: "var(--text-primary)" }} />
        );
      }
      return <span className="text-[11px] font-mono" style={{ color: "var(--text-primary)" }}>${num.toLocaleString("es")}</span>;
    }

    if (col === "brief_date" || col === "launch_date" || col === "presentation_date") {
      if (isEditing) {
        return (
          <input ref={inputRef as React.Ref<HTMLInputElement>} type="date" defaultValue={toDateInput(strVal)}
            onBlur={(e) => commitEdit(row.id, col, e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") commitEdit(row.id, col, (e.target as HTMLInputElement).value); if (e.key === "Escape") cancelEdit(); }}
            autoFocus
            className="w-full px-1 py-0.5 rounded text-[11px] outline-none"
            style={{ background: "var(--input-bg)", border: "1px solid var(--accent-cyan)", color: "var(--text-primary)" }} />
        );
      }
      return <span className="text-[11px]" style={{ color: "var(--text-primary)" }}>{formatDate(strVal) || "—"}</span>;
    }

    if (col === "status_btlive" || col === "status_migrante") {
      if (isEditing) {
        return (
          <input ref={inputRef as React.Ref<HTMLInputElement>} type="text" defaultValue={strVal}
            onBlur={(e) => { if (e.target.value !== strVal) commitEdit(row.id, col, e.target.value); else cancelEdit(); }}
            onKeyDown={(e) => { if (e.key === "Enter") commitEdit(row.id, col, (e.target as HTMLInputElement).value); if (e.key === "Escape") cancelEdit(); }}
            autoFocus
            className="w-full px-1 py-0.5 rounded text-[11px] outline-none"
            style={{ background: "var(--input-bg)", border: "1px solid var(--accent-cyan)", color: "var(--text-primary)" }} />
        );
      }
      return <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{strVal || "—"}</span>;
    }

    if (isEditing) {
      return (
        <input ref={inputRef as React.Ref<HTMLInputElement>} type="text" defaultValue={strVal}
          onBlur={(e) => { if (e.target.value !== strVal) commitEdit(row.id, col, e.target.value); else cancelEdit(); }}
          onKeyDown={(e) => { if (e.key === "Enter") commitEdit(row.id, col, (e.target as HTMLInputElement).value); if (e.key === "Escape") cancelEdit(); }}
          autoFocus
          className="w-full px-1 py-0.5 rounded text-[11px] outline-none"
          style={{ background: "var(--input-bg)", border: "1px solid var(--accent-cyan)", color: "var(--text-primary)" }} />
      );
    }

    return <span className="text-[11px]" style={{ color: "var(--text-primary)" }}>{strVal || "—"}</span>;
  }

  const COL_COUNT = visibleColumns.length + 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid" style={{ borderColor: "var(--accent-cyan)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const totalBudget = filteredRows.reduce((s, r) => s + Number(r.budget || 0), 0);
  const pendingClientCount = filteredRows.filter((r) => r.creative_status === "Pending Client").length;

  return (
    <div className="space-y-3 animate-fadeIn">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {!disableSearch && (
          <div className="relative flex-1 max-w-[180px]">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..."
              className="w-full pl-7 pr-2 py-1.5 rounded-lg text-[11px] outline-none transition-all"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
          </div>
        )}

        <select value={filterArea} onChange={(e) => setFilterArea(e.target.value)}
          className="px-2 py-1.5 rounded-lg text-[11px] outline-none"
          style={{ background: "var(--card-bg)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
          <option value="">Área</option>
          {AREAS.map((a) => (<option key={a} value={a}>{a}</option>))}
        </select>

        <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)}
          className="px-2 py-1.5 rounded-lg text-[11px] outline-none"
          style={{ background: "var(--card-bg)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
          <option value="">Tier</option>
          {TIERS.map((t) => (<option key={t} value={t}>{t}</option>))}
        </select>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-2 py-1.5 rounded-lg text-[11px] outline-none"
          style={{ background: "var(--card-bg)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
          <option value="">Status</option>
          {CREATIVE_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>

        {/* Column visibility */}
        <div className="relative" ref={columnMenuRef}>
          <button onClick={() => setShowColumnMenu(!showColumnMenu)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] outline-none transition-all"
            style={{ background: "var(--card-bg)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <Eye size={12} /> Columnas
          </button>
          {showColumnMenu && (
            <div className="absolute top-full mt-1 left-0 z-50 p-2 rounded-lg shadow-lg"
              style={{ background: "var(--card-bg)", border: "1px solid var(--border)", minWidth: 150 }}>
              {ALL_COLUMNS.map((c) => (
                <label key={c.key} className="flex items-center gap-2 px-2 py-1 rounded text-[11px] cursor-pointer hover:opacity-80"
                  style={{ color: "var(--text-secondary)" }}>
                  <input type="checkbox" checked={columnVisibility[c.key] ?? c.defaultVisible}
                    onChange={() => setColumnVisibility((prev) => ({ ...prev, [c.key]: !(prev[c.key] ?? c.defaultVisible) }))} />
                  {c.label}
                </label>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-all ml-auto"
          style={{ background: "var(--accent-cyan)" }}>
          <Plus size={13} /> +Proyecto
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--card-border)" }}>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: "var(--table-header)" }}>
              <th className="sticky left-0 z-10 px-2 py-3 border-b text-[10px] font-semibold uppercase tracking-wider text-left"
                style={{ background: "var(--table-header)", borderColor: "var(--divider)", width: 28, minWidth: 28 }} />
              {visibleColumns.map((col, idx) => (
                <th key={col.key}
                  className={`px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap border-b ${idx === 0 ? "sticky left-[28px] z-10" : ""}`}
                  style={{
                    color: "var(--text-secondary)", borderColor: "var(--divider)",
                    width: col.width, minWidth: col.width,
                    ...(idx === 0 ? { background: "var(--table-header)", left: 28 } : {}),
                  }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={COL_COUNT} className="text-center py-12 text-[11px]" style={{ color: "var(--text-muted)" }}>
                  No hay proyectos que coincidan con los filtros.
                </td>
              </tr>
            )}
            {filteredRows.map((row, i) => {
              const isExpanded = expandedRows.has(row.id);
              const projectTasks = tasks[row.id] || [];
              const nf = newTaskForm[row.id] || { title: "", description: "", priority: "MEDIUM", assignee_id: "", start_date: "", due_date: "" };
              const isEven = i % 2 === 0;

              return (
                <React.Fragment key={row.id}>
                  <tr ref={i === 0 ? newRowRef : undefined}
                    onClick={() => openDrawer(row)}
                    className="transition-colors cursor-pointer"
                    style={{ background: isEven ? "var(--card-bg)" : "var(--table-header)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accordion-bg, rgba(0,0,0,0.03))"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isEven ? "var(--card-bg)" : "var(--table-header)"; }}>
                    <td className="sticky left-0 z-10 px-2 py-3 border-b"
                      style={{ borderColor: "var(--divider)", background: isEven ? "var(--card-bg)" : "var(--table-header)" }}>
                      <button onClick={(e) => { e.stopPropagation(); toggleExpand(row.id); }}
                        className="p-0.5 rounded hover:opacity-70 transition-all"
                        style={{ color: "var(--text-muted)" }}>
                        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>
                    </td>
                    {visibleColumns.map((col, idx) => (
                      <td key={col.key}
                        className={`px-3 py-3 border-b ${idx === 0 ? "sticky left-[28px] z-10" : ""}`}
                        style={{
                          borderColor: "var(--divider)", maxWidth: col.width, width: col.width,
                          ...(idx === 0 ? { background: isEven ? "var(--card-bg)" : "var(--table-header)", left: 28 } : {}),
                        }}
                        onClick={(e) => {
                          if (col.key === "actions") return;
                          if (!editing) { e.stopPropagation(); startEdit(row.id, col.key as EditableCol); }
                        }}>
                        {renderCell(row, col.key)}
                      </td>
                    ))}
                  </tr>

                  {/* Notes popover inline */}
                  {notesPopover === row.id && (
                    <tr>
                      <td colSpan={COL_COUNT} className="p-0">
                        <div className="px-4 py-2 border-b" style={{ borderColor: "var(--divider)", background: "var(--accordion-bg, rgba(0,0,0,0.02))" }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Notas del proyecto</span>
                            <button onClick={() => setNotesPopover(null)} className="ml-auto p-0.5 rounded hover:opacity-70" style={{ color: "var(--text-muted)" }}>
                              <X size={12} />
                            </button>
                          </div>
                          <textarea ref={notesRef} value={notesEditValue}
                            onChange={(e) => setNotesEditValue(e.target.value)}
                            rows={3}
                            className="w-full px-2 py-1.5 rounded text-[11px] outline-none resize-none"
                            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
                          <div className="flex items-center gap-2 mt-1">
                            <button onClick={() => saveNotes(row.id)}
                              className="px-3 py-1 rounded text-[10px] font-semibold text-white"
                              style={{ background: "var(--accent-cyan)" }}>
                              Guardar notas
                            </button>
                            <button onClick={() => setNotesPopover(null)}
                              className="px-3 py-1 rounded text-[10px]"
                              style={{ color: "var(--text-muted)" }}>
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Expanded task row */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={COL_COUNT} className="p-0">
                        <div className="px-4 pb-3 pt-1 animate-slideUp"
                          style={{ background: "var(--accordion-bg, rgba(0,0,0,0.02))" }}>
                          <div className="py-2 flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                              Tareas ({projectTasks.length})
                            </span>
                          </div>

                          {projectTasks.length > 0 && (
                            <div className="space-y-1 mb-2">
                              {projectTasks.map((task) => {
                                const assignee = profiles.find((p) => p.id === task.assignee_id);
                                const isRedAlert = isTaskRedAlert(task.status, row);
                                const statusStyle = isRedAlert
                                  ? { bg: "rgba(244,63,94,0.32)", text: "var(--accent-rose)" }
                                  : (TASK_STATUS_STYLE[task.status] || { bg: "var(--card-bg)", text: "var(--text-muted)" });
                                const priorityStyle = PRIORITY_STYLE[task.priority] || { bg: "var(--divider)", text: "var(--text-muted)" };
                                return (
                                  <div key={task.id}
                                    className="flex flex-col gap-1 px-2 py-1.5 rounded text-[11px]"
                                    style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <select value={task.status}
                                        onChange={(e) => {
                                          const next = e.target.value;
                                          if (next === "COMPLETED" && task.status !== "COMPLETED") {
                                            requestDeliveryDate("task", task.id, task.project_id, next, task.title);
                                          } else {
                                            updateTaskStatus(task.id, next);
                                          }
                                        }}
                                        className="px-1.5 py-0.5 rounded text-[10px] font-bold outline-none cursor-pointer"
                                        style={{ background: statusStyle.bg, color: statusStyle.text, border: "1px solid " + statusStyle.text }}>
                                        {TASK_STATUSES.map((s) => (<option key={s} value={s}>{s.replace("_", " ")}</option>))}
                                      </select>
                                      {isRedAlert && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap"
                                          style={{ background: "rgba(244,63,94,0.18)", color: "var(--accent-rose)" }}>
                                          <Lock size={9} className="inline mr-0.5 -mt-0.5" /> {task.status === "BLOCKED" ? "BLOQUEADA" : "ALERTA"}
                                        </span>
                                      )}
                                      <button
                                        onClick={() => toggleTaskBlock(task.id, task.project_id, task.status === "BLOCKED")}
                                        title={task.status === "BLOCKED" ? "Desbloquear tarea" : "Marcar como bloqueada"}
                                        className="p-1 rounded hover:opacity-70 transition-all"
                                        style={{ color: task.status === "BLOCKED" ? "var(--accent-rose)" : "var(--text-muted)" }}>
                                        {task.status === "BLOCKED" ? <LockOpen size={13} /> : <Lock size={13} />}
                                      </button>
                                      <input type="text" defaultValue={task.title}
                                        placeholder="Nombre de tarea"
                                        onBlur={(e) => { if (e.target.value.trim() !== (task.title || "")) updateTaskTitle(task.id, e.target.value.trim()); }}
                                        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                                        className="flex-1 min-w-0 rounded px-1.5 py-0.5 text-[11px] font-semibold outline-none"
                                        style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
                                      <select value={task.priority}
                                        onChange={(e) => updateTaskPriority(task.id, e.target.value)}
                                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold outline-none cursor-pointer border-0"
                                        style={{ background: priorityStyle.bg, color: priorityStyle.text }}>
                                        {TASK_PRIORITIES.map((p) => (<option key={p} value={p}>{p}</option>))}
                                      </select>
                                      <span className="text-[9px] font-medium" style={{ color: "var(--text-muted)" }}>Inicio</span>
                                      <input type="date" value={toDateInput(task.start_date)}
                                        onChange={(e) => updateTaskStartDate(task.id, e.target.value)}
                                        className="px-1 py-0.5 rounded text-[10px] outline-none"
                                        style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)", maxWidth: 95 }} />
                                      <span className="text-[9px] font-medium" style={{ color: "var(--text-muted)" }}>Entrega</span>
                                      <input type="date" value={toDateInput(task.due_date)}
                                        onChange={(e) => updateTaskDueDate(task.id, e.target.value)}
                                        className="px-1 py-0.5 rounded text-[10px] outline-none"
                                        style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)", maxWidth: 95 }} />
                                      <select value={task.assignee_id || ""}
                                        onChange={(e) => assignTask(task.id, e.target.value)}
                                        className="px-1.5 py-0.5 rounded text-[10px] outline-none cursor-pointer"
                                        style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)", maxWidth: 100 }}>
                                        <option value="">Asignar</option>
                                        {profiles.map((p) => (<option key={p.id} value={p.id}>{p.full_name}</option>))}
                                      </select>
                                    </div>

                                    <input type="text" defaultValue={task.description}
                                      placeholder="Descripción..."
                                      onBlur={(e) => { if (e.target.value !== (task.description || "")) updateTaskDescription(task.id, e.target.value); }}
                                      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                                      className="w-full px-1.5 py-0.5 rounded text-[10px] outline-none"
                                      style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-secondary)" }} />

                                    <div className="flex flex-col gap-1 mt-0.5">
                                      {(taskComments[task.id] || []).length > 0 && (
                                        <div className="flex flex-col gap-0.5">
                                          {(taskComments[task.id] || []).map((c) => {
                                            const author = profiles.find((p) => p.id === c.author_id);
                                            return (
                                              <div key={c.id} className="text-[10px] leading-tight" style={{ color: "var(--text-secondary)" }}>
                                                <span className="font-semibold" style={{ color: "var(--accent-cyan)" }}>{author?.full_name || "Anónimo"}:</span> {c.content}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                      {!taskComments[task.id] && (
                                        <button onClick={() => loadComments(task.id)}
                                          className="text-[9px] text-left underline underline-offset-2 hover:opacity-70"
                                          style={{ color: "var(--text-muted)" }}>
                                          Cargar comentarios
                                        </button>
                                      )}
                                      <div className="flex items-center gap-1">
                                        <input type="text" value={commentInputs[task.id] || ""}
                                          onChange={(e) => setCommentInputs((prev) => ({ ...prev, [task.id]: e.target.value }))}
                                          placeholder="Escribe un comentario..."
                                          onKeyDown={(e) => { if (e.key === "Enter") addComment(task.id); }}
                                          className="flex-1 px-1.5 py-0.5 rounded text-[10px] outline-none"
                                          style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
                                        <button onClick={() => addComment(task.id)}
                                          className="px-1.5 py-0.5 rounded text-[9px] font-semibold text-white"
                                          style={{ background: "var(--accent-cyan)" }}>
                                          Enviar
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div className="flex flex-col gap-1.5 p-2 rounded-lg" style={{ background: "var(--card-bg)", border: "1px dashed var(--card-border)" }}>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <input type="text" value={nf.title}
                                onChange={(e) => setNewTaskForm((prev) => ({ ...prev, [row.id]: { ...nf, title: e.target.value } }))}
                                placeholder="Título..." onKeyDown={(e) => { if (e.key === "Enter") addTask(row.id); }}
                                className="flex-1 min-w-[100px] px-2 py-1 rounded text-[11px] outline-none"
                                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
                              <select value={nf.priority}
                                onChange={(e) => setNewTaskForm((prev) => ({ ...prev, [row.id]: { ...nf, priority: e.target.value } }))}
                                className="px-1.5 py-1 rounded text-[10px] font-semibold outline-none cursor-pointer"
                                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
                                {TASK_PRIORITIES.map((p) => (<option key={p} value={p}>{p}</option>))}
                              </select>
                              <span className="text-[9px] font-medium" style={{ color: "var(--text-muted)" }}>Inicio</span>
                              <input type="date" value={nf.start_date}
                                onChange={(e) => setNewTaskForm((prev) => ({ ...prev, [row.id]: { ...nf, start_date: e.target.value } }))}
                                className="px-1 py-0.5 rounded text-[10px] outline-none"
                                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)", maxWidth: 95 }} />
                              <span className="text-[9px] font-medium" style={{ color: "var(--text-muted)" }}>Entrega</span>
                              <input type="date" value={nf.due_date}
                                onChange={(e) => setNewTaskForm((prev) => ({ ...prev, [row.id]: { ...nf, due_date: e.target.value } }))}
                                className="px-1 py-0.5 rounded text-[10px] outline-none"
                                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)", maxWidth: 95 }} />
                              <select value={nf.assignee_id}
                                onChange={(e) => setNewTaskForm((prev) => ({ ...prev, [row.id]: { ...nf, assignee_id: e.target.value } }))}
                                className="px-1.5 py-1 rounded text-[10px] outline-none cursor-pointer"
                                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)", maxWidth: 100 }}>
                                <option value="">Asignar</option>
                                {profiles.map((p) => (<option key={p.id} value={p.id}>{p.full_name}</option>))}
                              </select>
                              <button onClick={() => addTask(row.id)}
                                className="px-2 py-1 rounded text-[10px] font-semibold text-white"
                                style={{ background: "var(--accent-cyan)" }}>+Tarea</button>
                            </div>
                            <textarea value={nf.description} onChange={(e) => setNewTaskForm((prev) => ({ ...prev, [row.id]: { ...nf, description: e.target.value } }))}
                              placeholder="Descripción..." rows={1}
                              className="w-full px-2 py-1 rounded text-[10px] outline-none resize-none"
                              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-secondary)" }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--text-muted)" }}>
        <span>{filteredRows.length} proyectos</span>
        <span className="w-px h-2.5" style={{ background: "var(--divider)" }} />
        <span>Presupuesto: <span className="font-semibold" style={{ color: "var(--text-primary)" }}>${totalBudget.toLocaleString("es")}</span></span>
        <span className="w-px h-2.5" style={{ background: "var(--divider)" }} />
        <span>Pendientes: <span className="font-semibold" style={{ color: "var(--accent-rose)" }}>{pendingClientCount}</span></span>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setShowCreateModal(false)} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl p-6 animate-fadeIn"
            style={{ background: "var(--background)", border: "1px solid var(--border)", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Nuevo Proyecto</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded hover:opacity-70" style={{ color: "var(--text-muted)" }}><X size={16} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Nombre del proyecto *</label>
                <input type="text" value={createForm.project_name} onChange={(e) => setCreateForm((p) => ({ ...p, project_name: e.target.value }))}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg text-[12px] outline-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Cliente</label>
                <input type="text" value={createForm.client_owner} onChange={(e) => setCreateForm((p) => ({ ...p, client_owner: e.target.value }))}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg text-[12px] outline-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Área</label>
                <select value={createForm.area} onChange={(e) => setCreateForm((p) => ({ ...p, area: e.target.value }))}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg text-[12px] outline-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
                  <option value="">Seleccionar</option>
                  {AREAS.map((a) => (<option key={a} value={a}>{a}</option>))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Tier</label>
                <select value={createForm.tier} onChange={(e) => setCreateForm((p) => ({ ...p, tier: e.target.value }))}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg text-[12px] outline-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
                  <option value="">Seleccionar</option>
                  {TIERS.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Presupuesto</label>
                <input type="number" value={createForm.budget} onChange={(e) => setCreateForm((p) => ({ ...p, budget: e.target.value }))}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg text-[12px] outline-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Responsable</label>
                <input type="text" value={createForm.resp_bt} onChange={(e) => setCreateForm((p) => ({ ...p, resp_bt: e.target.value }))}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg text-[12px] outline-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Brief Date</label>
                <input type="date" value={createForm.brief_date} onChange={(e) => setCreateForm((p) => ({ ...p, brief_date: e.target.value }))}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg text-[12px] outline-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Deadline</label>
                <input type="date" value={createForm.end_date} onChange={(e) => setCreateForm((p) => ({ ...p, end_date: e.target.value }))}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg text-[12px] outline-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Lanzamiento</label>
                <input type="date" value={createForm.launch_date} onChange={(e) => setCreateForm((p) => ({ ...p, launch_date: e.target.value }))}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg text-[12px] outline-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Presentación</label>
                <input type="date" value={createForm.presentation_date} onChange={(e) => setCreateForm((p) => ({ ...p, presentation_date: e.target.value }))}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg text-[12px] outline-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Status BT Live</label>
                <input type="text" value={createForm.status_btlive} onChange={(e) => setCreateForm((p) => ({ ...p, status_btlive: e.target.value }))}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg text-[12px] outline-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Status Migrante</label>
                <input type="text" value={createForm.status_migrante} onChange={(e) => setCreateForm((p) => ({ ...p, status_migrante: e.target.value }))}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg text-[12px] outline-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Link Brief</label>
                <input type="text" value={createForm.brief_link} onChange={(e) => setCreateForm((p) => ({ ...p, brief_link: e.target.value }))}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg text-[12px] outline-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Link Decks</label>
                <input type="text" value={createForm.decks_link} onChange={(e) => setCreateForm((p) => ({ ...p, decks_link: e.target.value }))}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg text-[12px] outline-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Notas</label>
                <textarea value={createForm.team_notes} onChange={(e) => setCreateForm((p) => ({ ...p, team_notes: e.target.value }))}
                  rows={2} className="w-full mt-0.5 px-3 py-2 rounded-lg text-[12px] outline-none resize-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-secondary)" }} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg text-[11px] font-medium"
                style={{ color: "var(--text-muted)" }}>Cancelar</button>
              <button onClick={handleCreateProject}
                className="px-4 py-2 rounded-lg text-[11px] font-semibold text-white"
                style={{ background: "var(--accent-cyan)" }}>Crear Proyecto</button>
            </div>
          </div>
        </div>
      )}

      {/* Project Detail Drawer */}
      {drawerProject && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.3)" }} onClick={closeDrawer} />
          <div className="relative w-full max-w-md h-full overflow-y-auto animate-slideLeft"
            style={{ background: "var(--background)", borderLeft: "1px solid var(--border)", boxShadow: "-4px 0 20px rgba(0,0,0,0.15)" }}>
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b"
              style={{ background: "var(--background)", borderColor: "var(--divider)" }}>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                  {drawerProject.project_name}
                </span>
                <div className="flex items-center gap-1.5">
                  {drawerProject.tier && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: TIER_STYLE[drawerProject.tier]?.bg, color: TIER_STYLE[drawerProject.tier]?.text }}>
                      {drawerProject.tier}
                    </span>
                  )}
                  {drawerProject.area && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium"
                      style={{ background: `${(AREA_COLORS[drawerProject.area] || "var(--text-muted)")}20`, color: AREA_COLORS[drawerProject.area] || "var(--text-muted)" }}>
                      {drawerProject.area}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={closeDrawer} className="p-1.5 rounded-lg hover:opacity-70 transition-all" style={{ color: "var(--text-muted)" }}>
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Nombre del proyecto */}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Nombre del proyecto</span>
                <input type="text" value={drawerProject.project_name}
                  onChange={(e) => setDrawerProject({ ...drawerProject, project_name: e.target.value })}
                  onBlur={(e) => commitEdit(drawerProject.id, "project_name", e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-lg text-[12px] outline-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
              </div>

              {/* Status */}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Estado Creativo</span>
                <select value={drawerProject.creative_status || ""}
                  onChange={(e) => setDrawerProject({ ...drawerProject, creative_status: e.target.value })}
                  onBlur={(e) => commitEdit(drawerProject.id, "creative_status", e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-lg text-[12px] outline-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
                  {CREATIVE_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
              </div>

              {/* Fechas */}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Cronograma</span>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {[
                    { label: "Brief", col: "brief_date" as const },
                    { label: "Deadline", col: "end_date" as const },
                    { label: "Lanzamiento", col: "launch_date" as const },
                    { label: "Presentación", col: "presentation_date" as const },
                  ].map((f) => (
                    <div key={f.label} className="px-3 py-2 rounded-lg" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                      <span className="text-[9px] font-medium" style={{ color: "var(--text-muted)" }}>{f.label}</span>
                      <input type="date" value={toDateInput(String(drawerProject[f.col] || ""))}
                        onChange={(e) => setDrawerProject({ ...drawerProject, [f.col]: e.target.value })}
                        onBlur={(e) => commitEdit(drawerProject.id, f.col, e.target.value)}
                        className="w-full mt-1 bg-transparent text-[12px] font-medium outline-none"
                        style={{ color: "var(--text-primary)" }} />
                    </div>
                  ))}
                  <div className="px-3 py-2 rounded-lg" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                    <span className="text-[9px] font-medium" style={{ color: "var(--text-muted)" }}>Días habiles</span>
                    <p className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>{String(drawerProject.working_days || "—")}</p>
                  </div>
                </div>
              </div>

              {/* Cliente y Responsable */}
              <div className="grid grid-cols-2 gap-3">
                <div className="px-3 py-2 rounded-lg" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                  <span className="text-[9px] font-medium" style={{ color: "var(--text-muted)" }}>Cliente</span>
                  <input type="text" value={drawerProject.client_owner || ""}
                    onChange={(e) => setDrawerProject({ ...drawerProject, client_owner: e.target.value })}
                    onBlur={(e) => commitEdit(drawerProject.id, "client_owner", e.target.value)}
                    className="w-full mt-0.5 bg-transparent text-[12px] font-medium outline-none"
                    style={{ color: "var(--text-primary)" }} />
                </div>
                <div className="px-3 py-2 rounded-lg" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                  <span className="text-[9px] font-medium" style={{ color: "var(--text-muted)" }}>Responsable</span>
                  <input type="text" value={drawerProject.resp_bt || ""}
                    onChange={(e) => setDrawerProject({ ...drawerProject, resp_bt: e.target.value })}
                    onBlur={(e) => commitEdit(drawerProject.id, "resp_bt", e.target.value)}
                    className="w-full mt-0.5 bg-transparent text-[12px] font-medium outline-none"
                    style={{ color: "var(--text-primary)" }} />
                </div>
              </div>

              {/* Estados de producción */}
              <div className="grid grid-cols-2 gap-3">
                <div className="px-3 py-2 rounded-lg" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                  <span className="text-[9px] font-medium" style={{ color: "var(--text-muted)" }}>Status BT Live</span>
                  <input type="text" value={drawerProject.status_btlive || ""}
                    onChange={(e) => setDrawerProject({ ...drawerProject, status_btlive: e.target.value })}
                    onBlur={(e) => commitEdit(drawerProject.id, "status_btlive", e.target.value)}
                    className="w-full mt-0.5 bg-transparent text-[12px] font-medium outline-none"
                    style={{ color: "var(--text-primary)" }} />
                </div>
                <div className="px-3 py-2 rounded-lg" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                  <span className="text-[9px] font-medium" style={{ color: "var(--text-muted)" }}>Status Migrante</span>
                  <input type="text" value={drawerProject.status_migrante || ""}
                    onChange={(e) => setDrawerProject({ ...drawerProject, status_migrante: e.target.value })}
                    onBlur={(e) => commitEdit(drawerProject.id, "status_migrante", e.target.value)}
                    className="w-full mt-0.5 bg-transparent text-[12px] font-medium outline-none"
                    style={{ color: "var(--text-primary)" }} />
                </div>
              </div>

              {/* Presupuesto */}
              <div className="px-3 py-2 rounded-lg" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <span className="text-[9px] font-medium" style={{ color: "var(--text-muted)" }}>Presupuesto</span>
                <input type="number" value={Number(drawerProject.budget || 0)}
                  onChange={(e) => setDrawerProject({ ...drawerProject, budget: parseFloat(e.target.value) || 0 })}
                  onBlur={(e) => commitEdit(drawerProject.id, "budget", e.target.value)}
                  className="w-full mt-0.5 bg-transparent text-[14px] font-bold font-mono outline-none"
                  style={{ color: "var(--accent-green)" }} />
              </div>

              {/* Tier y Área */}
              <div className="grid grid-cols-2 gap-3">
                <div className="px-3 py-2 rounded-lg" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                  <span className="text-[9px] font-medium" style={{ color: "var(--text-muted)" }}>Tier</span>
                  <select value={drawerProject.tier || ""}
                    onChange={(e) => setDrawerProject({ ...drawerProject, tier: e.target.value })}
                    onBlur={(e) => commitEdit(drawerProject.id, "tier", e.target.value)}
                    className="w-full mt-0.5 bg-transparent text-[12px] font-medium outline-none"
                    style={{ color: "var(--text-primary)" }}>
                    {TIERS.map((t) => (<option key={t} value={t}>{t}</option>))}
                  </select>
                </div>
                <div className="px-3 py-2 rounded-lg" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                  <span className="text-[9px] font-medium" style={{ color: "var(--text-muted)" }}>Área</span>
                  <input type="text" value={drawerProject.area || ""}
                    onChange={(e) => setDrawerProject({ ...drawerProject, area: e.target.value })}
                    onBlur={(e) => commitEdit(drawerProject.id, "area", e.target.value)}
                    className="w-full mt-0.5 bg-transparent text-[12px] font-medium outline-none"
                    style={{ color: "var(--text-primary)" }} />
                </div>
              </div>

              {/* Activos */}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Activos</span>
                <div className="mt-1.5 space-y-2">
                  <div className="px-3 py-2 rounded-lg" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                    <span className="text-[9px] font-medium" style={{ color: "var(--text-muted)" }}>Brief link</span>
                    <input type="url" value={drawerProject.brief_link || ""} placeholder="https://..."
                      onChange={(e) => setDrawerProject({ ...drawerProject, brief_link: e.target.value })}
                      onBlur={(e) => commitEdit(drawerProject.id, "brief_link", e.target.value)}
                      className="w-full mt-0.5 bg-transparent text-[12px] font-medium outline-none"
                      style={{ color: "var(--accent-cyan)" }} />
                  </div>
                  <div className="px-3 py-2 rounded-lg" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                    <span className="text-[9px] font-medium" style={{ color: "var(--text-muted)" }}>Decks link</span>
                    <input type="url" value={drawerProject.decks_link || ""} placeholder="https://..."
                      onChange={(e) => setDrawerProject({ ...drawerProject, decks_link: e.target.value })}
                      onBlur={(e) => commitEdit(drawerProject.id, "decks_link", e.target.value)}
                      className="w-full mt-0.5 bg-transparent text-[12px] font-medium outline-none"
                      style={{ color: "var(--accent-purple)" }} />
                  </div>
                </div>
              </div>

              {/* Notas (bitácora) */}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Bitácora / Notas</span>
                <textarea value={drawerProject.team_notes || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDrawerProject({ ...drawerProject, team_notes: val });
                  }}
                  onBlur={(e) => commitEdit(drawerProject.id, "team_notes", e.target.value)}
                  rows={4}
                  placeholder="Escribe notas del proyecto..."
                  className="w-full mt-1.5 px-3 py-2 rounded-lg text-[12px] outline-none resize-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Date Modal */}
      {deliveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setDeliveryModal(null)} />
          <div className="relative w-full max-w-sm rounded-xl p-6 animate-fadeIn"
            style={{ background: "var(--background)", border: "1px solid var(--border)", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Fecha real de entrega</h2>
              <button onClick={() => setDeliveryModal(null)} className="p-1 rounded hover:opacity-70" style={{ color: "var(--text-muted)" }}><X size={16} /></button>
            </div>
            <p className="text-[12px] mb-4" style={{ color: "var(--text-muted)" }}>
              {deliveryModal.kind === "task"
                ? `La tarea "${deliveryModal.taskTitle}" está por marcarse como ${deliveryModal.nextStatus}.`
                : `El proyecto está por marcarse como ${deliveryModal.nextStatus}.`}{" "}
              Indica la fecha en que se entregó realmente:
            </p>
            <input type="date" value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-[12px] outline-none mb-4"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setDeliveryModal(null)}
                className="px-3 py-2 rounded-lg text-[11px] font-medium"
                style={{ color: "var(--text-muted)" }}>
                Cancelar
              </button>
              <button onClick={confirmDelivery}
                className="px-4 py-2 rounded-lg text-[11px] font-semibold text-white"
                style={{ background: "var(--accent-green)" }}>
                Confirmar entrega
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
