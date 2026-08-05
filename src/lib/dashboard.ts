import { createClient } from "@/utils/supabase/client";

export interface DashboardTask {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  estimated_hours: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  assignee_id: string | null;
  project_id: string;
  projects: { id: string; name: string; account_id: string } | null;
}

export interface DashboardProfile {
  id: string;
  full_name: string | null;
  capacity: number | null;
}

export interface DashboardProject {
  id: string;
  name: string;
  status?: string;
}

/**
 * Carga las tareas (con su proyecto asociado), los perfiles y los proyectos.
 * Mantiene el fallback si `completed_at` no existe en el schema de tasks.
 */
export async function loadDashboardData(): Promise<{
  tasks: DashboardTask[];
  profiles: DashboardProfile[];
  projects: DashboardProject[];
}> {
  const supabase = createClient();

  const select = `
    id, title, status, due_date, estimated_hours, created_at, updated_at, completed_at,
    assignee_id,
    project_id, projects!inner(id, name, account_id)
  `;
  const selectNoCompleted = `
    id, title, status, due_date, estimated_hours, created_at, updated_at,
    assignee_id,
    project_id, projects!inner(id, name, account_id)
  `;

  const res = await supabase.from("tasks").select(select);
  if (res.error?.code === "PGRST204" && res.error.message?.includes("completed_at")) {
    const fb = await supabase.from("tasks").select(selectNoCompleted);
    return await finish(fb.data as DashboardTask[] | null);
  }

  const [profiles, projects] = await Promise.all([
    supabase.from("profiles").select("id, full_name, capacity") as unknown as Promise<{ data: DashboardProfile[] | null }>,
    supabase.from("projects").select("id, name, status") as unknown as Promise<{ data: DashboardProject[] | null }>,
  ]);

  return {
    tasks: (res.data as DashboardTask[] | null) || [],
    profiles: profiles.data || [],
    projects: projects.data || [],
  };

  async function finish(tasks: DashboardTask[] | null) {
    const [profiles, projects] = await Promise.all([
      supabase.from("profiles").select("id, full_name, capacity") as unknown as Promise<{ data: DashboardProfile[] | null }>,
      supabase.from("projects").select("id, name, status") as unknown as Promise<{ data: DashboardProject[] | null }>,
    ]);
    return {
      tasks: tasks || [],
      profiles: profiles.data || [],
      projects: projects.data || [],
    };
  }
}