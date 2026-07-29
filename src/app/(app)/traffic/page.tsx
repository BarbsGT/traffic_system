"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { TrafficLightHeader } from "@/components/traffic/TrafficLightHeader";
import { TrafficFilterBar } from "@/components/traffic/TrafficFilterBar";
import { TrafficAccordionGroup } from "@/components/traffic/TrafficAccordionGroup";
import { TrafficDataRow } from "@/components/traffic/TrafficDataRow";

type ViewType = "list" | "board" | "analytics" | "calendar" | "table";

interface AccountGroup {
  id: string;
  name: string;
  color: string;
  tasks: TaskRow[];
}

interface TaskRow {
  id: string;
  title: string;
  projectName: string;
  projectId: string;
  assigneeName: string;
  startDate: string;
  dueDate: string;
  priority: string;
  status: string;
  estimatedHours: number;
}

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendiente", color: "var(--accent-amber)" },
  IN_PROGRESS: { label: "Activo", color: "var(--accent-green)" },
  REVIEW: { label: "Revisión", color: "var(--accent-blue)" },
  COMPLETED: { label: "Completado", color: "var(--accent-green)" },
  BLOCKED: { label: "Bloqueado", color: "var(--accent-rose)" },
};

const priorityColors: Record<string, string> = {
  HIGH: "var(--accent-rose)",
  MEDIUM: "var(--accent-amber)",
  LOW: "var(--accent-green)",
};

function getStatusColor(status: string): string {
  return statusMap[status]?.color || "var(--text-muted)";
}

function getAccountColor(index: number): string {
  const colors = ["var(--accent-cyan)", "var(--accent-purple)", "var(--accent-green)", "var(--accent-amber)", "var(--accent-rose)"];
  return colors[index % colors.length];
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" });
}

export default function TrafficPage() {
  const [activeView, setActiveView] = useState<ViewType>("list");
  const [groups, setGroups] = useState<AccountGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("");
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .single();

      if (!profile) { setLoading(false); return; }

      setRole(profile.role);
      const isStaff = profile.role === "SUPERADMIN" || profile.role === "SYSADMIN";
      const isDirector = profile.role === "DIRECTOR";

      let accountIds: string[] = [];
      let taskFilter: any = {};

      if (isStaff) {
        const { data: pa } = await supabase.from("profile_accounts").select("account_id");
        accountIds = [...new Set((pa || []).map((r) => r.account_id))];
      } else if (isDirector) {
        const { data: pa } = await supabase
          .from("profile_accounts")
          .select("account_id")
          .eq("profile_id", user.id);
        accountIds = (pa || []).map((r) => r.account_id);
      } else {
        taskFilter = { assignee_id: user.id };
      }

      let data: AccountGroup[] = [];

      if (isStaff || isDirector) {
        const { data: tasks } = await supabase
          .from("tasks")
          .select(`
            id, title, status, priority, start_date, due_date, estimated_hours,
            project_id, projects!inner(id, name, account_id, accounts!inner(id, name))
          `)
          .order("created_at", { ascending: false });

        if (tasks) {
          const grouped: Record<string, { name: string; tasks: any[] }> = {};
          tasks.forEach((t: any) => {
            const aid = t.projects?.accounts?.id;
            const aname = t.projects?.accounts?.name;
            if (!aid || !aname) return;
            if (!isStaff && accountIds.length > 0 && !accountIds.includes(aid)) return;
            if (!grouped[aid]) grouped[aid] = { name: aname, tasks: [] };
            grouped[aid].tasks.push(t);
          });
          data = Object.entries(grouped).map(([id, g]) => ({
            id,
            name: g.name,
            color: getAccountColor(Object.keys(grouped).indexOf(id)),
            tasks: g.tasks.map((t: any) => ({
              id: t.id,
              title: t.title,
              projectName: t.projects?.name || "",
              projectId: t.project_id,
              assigneeName: "",
              startDate: formatDate(t.start_date),
              dueDate: formatDate(t.due_date),
              priority: t.priority,
              status: t.status,
              estimatedHours: Number(t.estimated_hours) || 0,
            })),
          }));
        }
      } else {
        const { data: tasks } = await supabase
          .from("tasks")
          .select(`
            id, title, status, priority, start_date, due_date, estimated_hours,
            project_id, projects!inner(id, name, account_id, accounts!inner(id, name))
          `)
          .eq("assignee_id", user.id)
          .order("created_at", { ascending: false });

        if (tasks) {
          const grouped: Record<string, { name: string; tasks: any[] }> = {};
          tasks.forEach((t: any) => {
            const aid = t.projects?.accounts?.id;
            const aname = t.projects?.accounts?.name;
            if (!aid || !aname) return;
            if (!grouped[aid]) grouped[aid] = { name: aname, tasks: [] };
            grouped[aid].tasks.push(t);
          });
          data = Object.entries(grouped).map(([id, g]) => ({
            id,
            name: g.name,
            color: getAccountColor(Object.keys(grouped).indexOf(id)),
            tasks: g.tasks.map((t: any) => ({
              id: t.id,
              title: t.title,
              projectName: t.projects?.name || "",
              projectId: t.project_id,
              assigneeName: "",
              startDate: formatDate(t.start_date),
              dueDate: formatDate(t.due_date),
              priority: t.priority,
              status: t.status,
              estimatedHours: Number(t.estimated_hours) || 0,
            })),
          }));
        }
      }

      if (data.length > 0) {
        const allTaskIds = data.flatMap((g) => g.tasks.map((t) => t.id));
        const { data: assignees } = await supabase
          .from("tasks")
          .select("id, profiles!tasks_assignee_id_fkey(full_name)")
          .in("id", allTaskIds);
        const nameMap: Record<string, string> = {};
        (assignees || []).forEach((t: any) => {
          nameMap[t.id] = (t.profiles as unknown as { full_name: string } | null)?.full_name || "";
        });
        data = data.map((g) => ({
          ...g,
          tasks: g.tasks.map((t) => ({ ...t, assigneeName: nameMap[t.id] || "Sin asignar" })),
        }));
      }

      setGroups(data);
      setLoading(false);
    };

    load();
  }, [supabase]);

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Gestión de Tráfico</h1>
          {role && (
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {role === "SUPERADMIN" || role === "SYSADMIN" ? "Vista global — todas las cuentas" :
               role === "DIRECTOR" ? "Vista por cuentas asignadas" :
               "Vista personal — tus tareas asignadas"}
            </p>
          )}
        </div>
        <TrafficLightHeader activeView={activeView} onViewChange={setActiveView} />
      </div>

      <TrafficFilterBar />

      {loading ? (
        <div className="flex items-center justify-center h-64 mt-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid" style={{ borderColor: "var(--accent-cyan)", borderTopColor: "transparent" }} />
        </div>
      ) : groups.length === 0 ? (
        <div className="flex items-center justify-center h-64 mt-8 rounded-xl" style={{ border: "1px dashed var(--border)", background: "var(--accordion-bg)" }}>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {role === "COLABORADOR"
              ? "No tienes tareas asignadas aún"
              : "No hay datos de tráfico disponibles. Ejecuta las migraciones y carga datos en Supabase."}
          </p>
        </div>
      ) : activeView === "list" ? (
        <div className="flex flex-col gap-3 mt-2">
          {groups.map((g, i) => (
            <TrafficAccordionGroup key={g.id} title={g.name} count={g.tasks.length} statusColor={g.color}>
              {g.tasks.map((t) => (
                <TrafficDataRow
                  key={t.id}
                  campaign={t.title}
                  platform={t.projectName.toLowerCase().includes("meta") ? "meta" : t.projectName.toLowerCase().includes("google") ? "google" : "tiktok"}
                  campaignId={t.projectId.slice(0, 8)}
                  traffickerName={t.assigneeName}
                  startDate={t.startDate}
                  endDate={t.dueDate}
                  priority={t.priority === "HIGH" ? "alta" : t.priority === "MEDIUM" ? "media" : "baja"}
                  status={t.status === "IN_PROGRESS" ? "activo" : t.status === "PENDING" ? "revision" : t.status === "COMPLETED" ? "finalizado" : t.status === "BLOCKED" ? "pausado" : "activo"}
                  roas={t.estimatedHours > 0 ? Math.round((t.estimatedHours / 10) * 100) / 100 : 0}
                  cpa={t.estimatedHours > 0 ? Math.round((100 / t.estimatedHours) * 100) / 100 : 0}
                  trend={[1, 2, 1.5, 2.5, 2, 3]}
                />
              ))}
            </TrafficAccordionGroup>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 mt-8 rounded-xl" style={{ border: "1px dashed var(--border)", background: "var(--accordion-bg)" }}>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Vista {activeView === "board" ? "Tablero" : activeView === "analytics" ? "Analytics" : activeView === "calendar" ? "Calendario" : "Tabla"} — Próximamente
          </p>
        </div>
      )}
    </div>
  );
}
