import { createClient } from "@/utils/supabase/client";
import { chunk } from "@/lib/utils";

export interface UATask {
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

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
}

export interface UAMatrixData {
  raw: Record<string, unknown>[];
  tasksByProject: Record<string, UATask[]>;
}

/**
 * Carga proyectos ua_traffic + sus tareas para una cuenta en un solo
 * round-trip mediante el RPC `get_ua_matrix`. Si el RPC no existe o
 * falla, hace fallback a las queries clásicas (con chunking).
 */
export async function loadUAMatrix(accountId: string): Promise<UAMatrixData> {
  const supabase = createClient();
  let raw: Record<string, unknown>[] = [];
  const tasksByProject: Record<string, UATask[]> = {};

  const { data: rpcData, error: rpcError } = await supabase
    .rpc("get_ua_matrix", { p_account_id: accountId });

  if (!rpcError && rpcData) {
    raw = (rpcData.projects as Record<string, unknown>[]) || [];
    ((rpcData.tasks as UATask[]) || []).forEach((t) => {
      (tasksByProject[t.project_id] = tasksByProject[t.project_id] || []).push(t);
    });
    return { raw, tasksByProject };
  }

  // Fallback a queries clásicas.
  const { data: projectsResult } = await supabase
    .from("projects")
    .select("*")
    .eq("type", "ua_traffic")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });
  raw = (projectsResult as Record<string, unknown>[]) || [];

  const projectIds = raw.map((r) => r.id as string);
  if (projectIds.length > 0) {
    const groupAll: UATask[] = [];
    for (const batch of chunk(projectIds, 100)) {
      const { data: batchTasks } = await supabase
        .from("tasks")
        .select("*")
        .in("project_id", batch);
      if (batchTasks) groupAll.push(...(batchTasks as UATask[]));
    }
    groupAll.forEach((t) => {
      (tasksByProject[t.project_id] = tasksByProject[t.project_id] || []).push(t);
    });
  }

  return { raw, tasksByProject };
}