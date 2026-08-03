"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { AlertTriangle, CheckCheck, CircleDot, RotateCcw } from "lucide-react";

type AlertStatus = "PENDING" | "GESTIONADA" | "DESBLOQUEADA";

interface BlockedTask {
  id: string;
  title: string;
  project_id: string;
  assignee_id: string | null;
  status: string;
  created_at: string;
  alert_status: AlertStatus;
  alert_status_at: string | null;
  alert_status_by: string | null;
  full_name?: string;
  project_name?: string;
  managed_by_name?: string;
}

type Tab = "activas" | "gestionadas" | "desbloqueadas";

export function BlockedAlerts() {
  const [tasks, setTasks] = useState<BlockedTask[]>([]);
  const [tab, setTab] = useState<Tab>("activas");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const supabase = createClient();

  const loadAlerts = useCallback(() => {
    supabase
      .from("tasks")
      .select(
        "*, profiles!tasks_assignee_id_fkey(full_name), projects!tasks_project_id_fkey(name), manager:alert_status_by(full_name)"
      )
      .or("status.eq.BLOCKED,alert_status.in.(GESTIONADA,DESBLOQUEADA)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setTasks(data.map((t) => ({
            id: t.id,
            title: t.title,
            project_id: t.project_id,
            assignee_id: t.assignee_id,
            status: t.status,
            created_at: t.created_at,
            alert_status: (t.alert_status || "PENDING") as AlertStatus,
            alert_status_at: t.alert_status_at,
            alert_status_by: t.alert_status_by,
            full_name: (t.profiles as unknown as { full_name: string } | null)?.full_name || "Sin asignar",
            project_name: (t.projects as unknown as { name: string } | null)?.name || "Proyecto desconocido",
            managed_by_name: (t.manager as unknown as { full_name: string } | null)?.full_name,
          })));
        }
        setLoading(false);
      });
  }, [supabase]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const changeStatus = async (task: BlockedTask, newStatus: AlertStatus) => {
    setBusyId(task.id);
    const update: Record<string, string> = { alert_status: newStatus };
    if (newStatus === "GESTIONADA" || newStatus === "DESBLOQUEADA") {
      update.alert_status_at = new Date().toISOString();
    }
    const { error } = await supabase.from("tasks").update(update).eq("id", task.id);
    setBusyId(null);
    if (!error) loadAlerts();
  };

  const resetStatus = async (task: BlockedTask) => {
    setBusyId(task.id);
    const { error } = await supabase.from("tasks").update({ alert_status: "PENDING" }).eq("id", task.id);
    setBusyId(null);
    if (!error) loadAlerts();
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "activas", label: "Activas", count: tasks.filter((t) => t.alert_status === "PENDING").length },
    { key: "gestionadas", label: "Gestionadas", count: tasks.filter((t) => t.alert_status === "GESTIONADA").length },
    { key: "desbloqueadas", label: "Desbloqueadas", count: tasks.filter((t) => t.alert_status === "DESBLOQUEADA").length },
  ];

  const visible = tasks.filter((t) => tab === "activas" ? t.alert_status === "PENDING" : tab === "gestionadas" ? t.alert_status === "GESTIONADA" : t.alert_status === "DESBLOQUEADA");

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
        Alertas y Recomendaciones
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
        Tareas bloqueadas que requieren atención. Márcalas como gestionadas o desbloquéalas para dejar trazabilidad con fecha.
      </p>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t.key ? "var(--accent-cyan)" : "var(--glass-bg)",
              color: tab === t.key ? "#fff" : "var(--text-secondary)",
            }}
          >
            {t.label} <span style={{ opacity: 0.75 }}>({t.count})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <GlassCard className="p-8 text-center">
          <p style={{ color: "var(--text-secondary)" }}>Cargando...</p>
        </GlassCard>
      ) : visible.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p style={{ color: "var(--text-secondary)" }}>
            {tab === "activas" ? "No hay alertas activas" : tab === "gestionadas" ? "No hay alertas gestionadas" : "No hay alertas desbloqueadas"}
          </p>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((t) => {
            const isManaged = t.alert_status === "GESTIONADA";
            const isUnblocked = t.alert_status === "DESBLOQUEADA";
            return (
              <GlassCard key={t.id} className="p-4" >
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} style={{ color: isUnblocked ? "var(--accent-green)" : isManaged ? "var(--accent-amber)" : "var(--accent-rose)", marginTop: 2 }} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{t.title}</h3>
                      <div className="flex items-center gap-2">
                        {isUnblocked ? (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(16,185,129,0.15)", color: "var(--accent-green)" }}>
                            DESBLOQUEADA
                          </span>
                        ) : isManaged ? (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(245,158,11,0.15)", color: "var(--accent-amber)" }}>
                            GESTIONADA
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(244,63,94,0.15)", color: "var(--accent-rose)" }}>
                            {t.status === "BLOCKED" ? "BLOQUEADA" : "SIN GESTIONAR"}
                          </span>
                        )}
                        {isManaged && t.status === "BLOCKED" && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(244,63,94,0.15)", color: "var(--accent-rose)" }}>
                            SIGUE BLOQUEADA
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs flex-wrap" style={{ color: "var(--text-muted)" }}>
                      <span>{t.project_name}</span>
                      <span>Asignado: {t.full_name}</span>
                      <span>Creada: {new Date(t.created_at).toLocaleDateString("es")}</span>
                      {(isManaged || isUnblocked) && t.alert_status_at && (
                        <span style={{ color: "var(--accent-cyan)" }}>
                          Estado cambiado: {new Date(t.alert_status_at).toLocaleString("es")}
                          {t.managed_by_name ? ` por ${t.managed_by_name}` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {!isUnblocked && (
                      <button
                        onClick={() => changeStatus(t, isManaged ? "DESBLOQUEADA" : "GESTIONADA")}
                        disabled={busyId === t.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                        style={{ background: isManaged ? "var(--accent-green)" : "var(--accent-amber)" }}
                      >
                        {isManaged ? <CheckCheck size={13} /> : <CircleDot size={13} />}
                        {isManaged ? "Desbloquear" : "Gestionada"}
                      </button>
                    )}
                    {isUnblocked && (
                      <button
                        onClick={() => resetStatus(t)}
                        disabled={busyId === t.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                        style={{ color: "var(--text-secondary)", background: "var(--glass-bg)", border: "1px solid var(--input-border)" }}
                      >
                        <RotateCcw size={13} />
                        Reabrir
                      </button>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
