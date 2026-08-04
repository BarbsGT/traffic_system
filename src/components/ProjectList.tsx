"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/tasks/StatusBadge";
import { isProjectOverdue } from "@/utils/taskAlerts";
import { FolderKanban, AlertTriangle } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  color: string;
  start_date: string | null;
  end_date: string | null;
  delivered_at: string | null;
}

interface Task {
  id: string;
  project_id: string;
  status: string;
}

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("projects").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setProjects(data);
    });
    supabase.from("tasks").select("id, project_id, status").then(({ data }) => {
      if (data) setTasks(data);
    });
  }, []);

  const getTaskCount = (projectId: string) => tasks.filter((t) => t.project_id === projectId).length;
  const getCompletedCount = (projectId: string) => tasks.filter((t) => t.project_id === projectId && t.status === "COMPLETED").length;

  const getProgress = (projectId: string) => {
    const total = getTaskCount(projectId);
    if (total === 0) return 0;
    return Math.round((getCompletedCount(projectId) / total) * 100);
  };

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Proyectos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => (
          <a key={p.id} href={`/projects/${p.id}`} className="block">
            <GlassCard className="p-5 hover:opacity-80 transition-all cursor-pointer h-full">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FolderKanban size={18} style={{ color: p.color || "var(--accent-cyan)" }} />
                  <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>{p.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {isProjectOverdue(p) && (
                    <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(244,63,94,0.15)", color: "var(--accent-rose)" }}>
                      <AlertTriangle size={11} className="mr-1" /> VENCIDO
                    </span>
                  )}
                  <StatusBadge status={p.status} />
                </div>
              </div>
              <p className="text-sm mb-4 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                {p.description || "Sin descripción"}
              </p>
              <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
                <span>{getTaskCount(p.id)} tareas</span>
                <span>{getCompletedCount(p.id)} completadas</span>
              </div>
              {getTaskCount(p.id) > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--divider)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${getProgress(p.id)}%`, background: "var(--accent-green)" }} />
                  </div>
                  <span className="text-xs mt-1 block" style={{ color: "var(--text-muted)" }}>{getProgress(p.id)}%</span>
                </div>
              )}
              {p.start_date && (
                <div className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
                  {p.start_date} {p.end_date ? `→ ${p.end_date}` : ""}
                </div>
              )}
            </GlassCard>
          </a>
        ))}
      </div>
      {projects.length === 0 && (
        <GlassCard className="p-8 text-center">
          <p style={{ color: "var(--text-muted)" }}>No hay proyectos</p>
        </GlassCard>
      )}
    </div>
  );
}
