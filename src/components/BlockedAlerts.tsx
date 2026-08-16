"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { isTaskRedAlert } from "@/utils/taskAlerts";
import { AlertTriangle, CheckCheck, CircleDot, RotateCcw, X } from "lucide-react";

type AlertStatus = "PENDING" | "GESTIONADA" | "DESBLOQUEADA";

const UNBLOCK_STATUSES = ["IN_PROGRESS", "REVIEW", "COMPLETED", "PENDING"];

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
  project_end_date?: string | null;
  project_delivered_at?: string | null;
}

type Tab = "activas" | "gestionadas" | "desbloqueadas";

export function BlockedAlerts() {
  const [tasks, setTasks] = useState<BlockedTask[]>([]);
  const [tab, setTab] = useState<Tab>("activas");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [unblockTarget, setUnblockTarget] = useState<BlockedTask | null>(null);
  const [unblockStatus, setUnblockStatus] = useState("IN_PROGRESS");
  const [myRole, setMyRole] = useState<string>("");

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
      setMyRole(profile?.role || "");
    });
  }, [supabase]);

  const canManage = myRole === "SUPERADMIN" || myRole === "SYSADMIN" || myRole === "DIRECTOR" || myRole === "GERENTE";

  const loadAlerts = useCallback(() => {
    supabase
      .from("tasks")
      .select(
        "*, profiles!tasks_assignee_id_fkey(full_name), projects!tasks_project_id_fkey(name, end_date, delivered_at), manager:alert_status_by(full_name)"
      )
      .or("status.in.(BLOCKED,PENDING,IN_PROGRESS,REVIEW),alert_status.in.(GESTIONADA,DESBLOQUEADA)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          const rawTasks = data.filter((t) => {
            const project = t.projects as unknown as { end_date?: string | null; delivered_at?: string | null } | null;
            return t.status === "BLOCKED" || t.alert_status !== "PENDING" || isTaskRedAlert(t.status as string, project);
          });
          setTasks(rawTasks.map((t) => ({
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
            project_end_date: (t.projects as unknown as { end_date?: string | null } | null)?.end_date,
            project_delivered_at: (t.projects as unknown as { delivered_at?: string | null } | null)?.delivered_at,
            managed_by_name: (t.manager as unknown as { full_name: string } | null)?.full_name,
          })));
        }
        setLoading(false);
      });
  }, [supabase]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const changeStatus = async (task: BlockedTask, newStatus: AlertStatus, newTaskStatus?: string) => {
    setBusyId(task.id);
    const update: Record<string, string | null> = { alert_status: newStatus };
    if (newStatus === "GESTIONADA" || newStatus === "DESBLOQUEADA") {
      update.alert_status_at = new Date().toISOString();
    }
    if (newStatus === "DESBLOQUEADA" && newTaskStatus) {
      update.status = newTaskStatus;
    }
    const { error } = await supabase.from("tasks").update(update).eq("id", task.id);
    setBusyId(null);
    if (!error) { setUnblockTarget(null); loadAlerts(); }
  };

  const openUnblock = (task: BlockedTask) => {
    setUnblockTarget(task);
    setUnblockStatus(task.status === "BLOCKED" ? "IN_PROGRESS" : task.status || "IN_PROGRESS");
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
        Alertas rojas: proyectos con deadline vencido y tareas en progreso, ajustes o pendientes, además de tareas bloqueadas. Márcalas como gestionadas o desbloquéalas para dejar trazabilidad con fecha.
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
            const isRed = isTaskRedAlert(t.status, { end_date: t.project_end_date, delivered_at: t.project_delivered_at });
            const alertColor = isUnblocked ? "var(--accent-green)" : isRed ? "var(--accent-rose)" : "var(--text-muted)";
            return (
              <GlassCard key={t.id} className="p-4" >
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} style={{ color: alertColor, marginTop: 2 }} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{t.title}</h3>
                      <div className="flex items-center gap-2">
                        {isUnblocked ? (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(125,216,125,0.15)", color: "var(--accent-green)" }}>
                            DESBLOQUEADA
                          </span>
                        ) : isManaged ? (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(255,209,102,0.15)", color: "var(--accent-amber)" }}>
                            GESTIONADA
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: isRed ? "rgba(255,138,138,0.15)" : "var(--card-bg)", color: isRed ? "var(--accent-rose)" : "var(--text-muted)" }}>
                            {t.status === "BLOCKED" ? "BLOQUEADA" : "VENCIDA"}
                          </span>
                        )}
                        {isManaged && t.status === "BLOCKED" && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(255,138,138,0.15)", color: "var(--accent-rose)" }}>
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
                    {canManage && !isUnblocked && (
                      <button
                        onClick={() => (isManaged ? openUnblock(t) : changeStatus(t, "GESTIONADA"))}
                        disabled={busyId === t.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#131313] disabled:opacity-50"
                        style={{ background: isManaged ? "var(--accent-green)" : "var(--accent-amber)" }}
                      >
                        {isManaged ? <CheckCheck size={13} /> : <CircleDot size={13} />}
                        {isManaged ? "Desbloquear" : "Gestionada"}
                      </button>
                    )}
                    {canManage && isUnblocked && (
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

      {/* Unblock status modal */}
      {unblockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setUnblockTarget(null)} />
          <div className="relative w-full max-w-sm rounded-xl p-6 animate-fadeIn"
            style={{ background: "var(--background)", border: "1px solid var(--border)", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Desbloquear alerta</h2>
              <button onClick={() => setUnblockTarget(null)} className="p-1 rounded hover:opacity-70" style={{ color: "var(--text-muted)" }}><X size={16} /></button>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              La tarea <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{unblockTarget.title}</span> fue desbloqueada.
              ¿A qué estado debe pasar?
            </p>
            <select value={unblockStatus} onChange={(e) => setUnblockStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none mb-4"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
              {UNBLOCK_STATUSES.map((s) => (<option key={s} value={s}>{s.replace("_", " ")}</option>))}
            </select>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setUnblockTarget(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ color: "var(--text-muted)" }}>
                Cancelar
              </button>
              <button onClick={() => changeStatus(unblockTarget, "DESBLOQUEADA", unblockStatus)}
                disabled={busyId === unblockTarget.id}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-[#131313] disabled:opacity-50"
                style={{ background: "var(--accent-green)" }}>
                Desbloquear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
