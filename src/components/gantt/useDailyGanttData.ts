"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { DailyGanttFilters, DailyGanttItem, MilestoneType } from "./DailyGanttTypes";

interface RawProject {
  id?: string | null;
  name?: string | null;
  brief_date?: string | null;
  end_date?: string | null;
  launch_date?: string | null;
  presentation_date?: string | null;
  creative_status?: string | null;
  accounts?: Array<{ id?: string | null; name?: string | null }> | { id?: string | null; name?: string | null } | null;
}

interface RawProjectRow {
  id?: string | null;
  name?: string | null;
  brief_date?: string | null;
  end_date?: string | null;
  launch_date?: string | null;
  presentation_date?: string | null;
  creative_status?: string | null;
  accounts?: Array<{ id?: string | null; name?: string | null }> | { id?: string | null; name?: string | null } | null;
}

interface RawTaskRow {
  id?: string | null;
  title?: string | null;
  status?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  delivered_at?: string | null;
  assignee_id?: string | null;
  project_id?: string | null;
  projects?: RawProject[] | RawProject | null;
}

interface TaskRow {
  id: string;
  title: string;
  status: string | null;
  start_date: string | null;
  due_date: string | null;
  delivered_at: string | null;
  assignee_id: string | null;
  project_id: string;
  projects?: {
    id: string;
    name: string;
    launch_date: string | null;
    brief_date?: string | null;
    end_date?: string | null;
    accounts?: { id: string; name: string } | null;
  } | null;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

function normalizeProject(raw: RawProjectRow) {
  const account = raw.accounts
    ? Array.isArray(raw.accounts)
      ? raw.accounts[0]
      : (raw.accounts ?? null)
    : null;
  return {
    id: raw.id ?? "",
    name: raw.name ?? "",
    brief_date: raw.brief_date ?? null,
    end_date: raw.end_date ?? null,
    launch_date: raw.launch_date ?? null,
    presentation_date: raw.presentation_date ?? null,
    creative_status: raw.creative_status ?? null,
    accountName: account?.name ?? "",
  };
}

function normalizeRow(raw: RawTaskRow): TaskRow {
  const project = Array.isArray(raw.projects) ? raw.projects[0] : (raw.projects ?? null);
  const account = project?.accounts
    ? Array.isArray(project.accounts)
      ? project.accounts[0]
      : (project.accounts ?? null)
    : null;
  return {
    id: raw.id ?? "",
    title: raw.title ?? "",
    status: raw.status ?? null,
    start_date: raw.start_date ?? null,
    due_date: raw.due_date ?? null,
    delivered_at: raw.delivered_at ?? null,
    assignee_id: raw.assignee_id ?? null,
    project_id: raw.project_id ?? "",
    projects: project
      ? {
          id: project.id ?? "",
          name: project.name ?? "",
          launch_date: project.launch_date ?? null,
          brief_date: project.brief_date ?? null,
          end_date: project.end_date ?? null,
          accounts: account ? { id: account.id ?? "", name: account.name ?? "" } : null,
        }
      : null,
  };
}

function classifyMilestone(
  title: string,
  status: string | null,
  dueDate: string | null,
  deliveredAt: string | null,
  projectLaunchDate: string | null,
): MilestoneType {
  const t = (title || "").toLowerCase();
  if (projectLaunchDate && dueDate && new Date(projectLaunchDate).getTime() === new Date(dueDate).getTime()) {
    return "GO_LIVE";
  }
  if (/(lanzamiento|launch|go live|salida a mercado)/.test(t)) return "GO_LIVE";
  if (status === "REVIEW" || status === "BLOCKED") return "CLIENT_APPROVAL";
  if (/(aprobaci|revisi|review|aprueba|approval|cliente)/.test(t)) return "CLIENT_APPROVAL";
  if (deliveredAt || status === "COMPLETED") return "DELIVERY";
  if (/(entrega|delivery|assets|master|enviar)/.test(t)) return "DELIVERY";
  return "AGENCY_EXECUTION";
}

export function useDailyGanttData(filters: DailyGanttFilters) {
  const [items, setItems] = useState<DailyGanttItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    setLoading(true);
    setError(null);

    (async () => {
    let projectsQuery = supabase
      .from("projects")
      .select("id, name, brief_date, end_date, launch_date, presentation_date, creative_status, accounts(id, name)");

    let tasksQuery = supabase
      .from("tasks")
      .select(`
        id, title, status, start_date, due_date, delivered_at, assignee_id, project_id,
        projects!inner(id, name, launch_date, brief_date, end_date, accounts(id, name))
      `);

    if (filters.projectId) {
      projectsQuery = projectsQuery.eq("id", filters.projectId);
      tasksQuery = tasksQuery.eq("project_id", filters.projectId);
    } else if (filters.accountId) {
      projectsQuery = projectsQuery.eq("account_id", filters.accountId);
      tasksQuery = tasksQuery.eq("projects.account_id", filters.accountId);
    } else if (filters.agencyId) {
      const accountIds = await supabase
        .from("account_agencies")
        .select("account_id")
        .eq("agency_id", filters.agencyId)
        .then(({ data }) => (data || []).map((r) => r.account_id));
      if (accountIds.length > 0) {
        projectsQuery = projectsQuery.in("account_id", accountIds);
        tasksQuery = tasksQuery.in("projects.account_id", accountIds);
      }
    }

    Promise.all([
      projectsQuery,
      tasksQuery,
      supabase.from("profiles").select("id, full_name, avatar_url"),
    ]).then(([projectRes, taskRes, profileRes]) => {
      if (projectRes.error) {
        setError(projectRes.error.message);
        setLoading(false);
        return;
      }
      if (taskRes.error) {
        setError(taskRes.error.message);
        setLoading(false);
        return;
      }
      const profiles: Record<string, ProfileRow> = {};
      ((profileRes.data as ProfileRow[]) || []).forEach((p) => { profiles[p.id] = p; });

      const projects = ((projectRes.data as RawProjectRow[]) || []).map(normalizeProject);
      const projectById = new Map(projects.map((p) => [p.id, p]));
      const taskRows = ((taskRes.data as RawTaskRow[]) || []).map(normalizeRow);

      const mapped: DailyGanttItem[] = [];

      // One item per project, brief_date = start, launch_date = end
      projects.forEach((p) => {
        const start = p.brief_date || p.launch_date || p.end_date || p.presentation_date || "";
        const end = p.launch_date || p.end_date || p.presentation_date || p.brief_date || start;
        if (!start) return;
        mapped.push({
          id: `proj-${p.id}`,
          projectId: p.id,
          projectName: p.name,
          accountName: p.accountName,
          startDate: start,
          endDate: end,
          responsibleName: "Proyecto",
          activityTitle: p.name,
          milestoneType: p.launch_date ? "GO_LIVE" : "DELIVERY",
          status: p.creative_status ?? undefined,
          isProject: true,
        });
      });

      // One item per task; fallback to project brief_date as start
      taskRows.forEach((t) => {
        const fullProj = projectById.get(t.project_id);
        const proj = fullProj || t.projects;
        const start = t.start_date || proj?.brief_date || t.due_date || "";
        const end = t.due_date || proj?.end_date || proj?.launch_date || t.start_date || "";
        if (!start) return;
        const assignee = t.assignee_id ? profiles[t.assignee_id] : null;
        mapped.push({
          id: t.id,
          projectId: t.project_id,
          projectName: proj?.name ?? "",
          accountName: fullProj?.accountName || t.projects?.accounts?.name || "",
          startDate: start,
          endDate: end,
          responsibleName: assignee?.full_name || "Sin asignar",
          responsibleAvatar: assignee?.avatar_url ?? undefined,
          activityTitle: t.title || "Sin título",
          milestoneType: classifyMilestone(t.title || "", t.status, t.due_date, t.delivered_at, proj?.launch_date ?? null),
          status: t.status ?? undefined,
        });
      });

      setItems(mapped);
      setLoading(false);
    });
    })();
  }, [filters.agencyId, filters.accountId, filters.projectId]);

  return { items, loading, error };
}
