"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { AlertTriangle } from "lucide-react";

interface BlockedTask {
  id: string;
  title: string;
  project_id: string;
  assignee_id: string | null;
  created_at: string;
  full_name?: string;
  project_name?: string;
}

export function BlockedAlerts() {
  const [tasks, setTasks] = useState<BlockedTask[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("tasks")
      .select("*, profiles!tasks_assignee_id_fkey(full_name), projects!tasks_project_id_fkey(name)")
      .eq("status", "BLOCKED")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setTasks(data.map((t) => ({
            id: t.id,
            title: t.title,
            project_id: t.project_id,
            assignee_id: t.assignee_id,
            created_at: t.created_at,
            full_name: (t.profiles as unknown as { full_name: string } | null)?.full_name || "Sin asignar",
            project_name: (t.projects as unknown as { name: string } | null)?.name || "Proyecto desconocido",
          })));
        }
      });
  }, []);

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
        Alertas de Tareas Bloqueadas
      </h1>

      {tasks.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p style={{ color: "var(--text-secondary)" }}>No hay tareas bloqueadas</p>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((t) => (
            <GlassCard key={t.id} className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} style={{ color: "var(--accent-rose)", marginTop: 2 }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{t.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "rgba(244,63,94,0.15)", color: "var(--accent-rose)" }}>
                      BLOQUEADA
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>{t.project_name}</span>
                    <span>Asignado: {t.full_name}</span>
                    <span>{new Date(t.created_at).toLocaleDateString("es")}</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
