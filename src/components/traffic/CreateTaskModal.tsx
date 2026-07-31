"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { X, CheckSquare } from "lucide-react";

interface Project { id: string; name: string; account_id: string; accounts?: { name: string }[] | { name: string } }
interface Profile { id: string; full_name: string }

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  defaultProjectId?: string;
}

export function CreateTaskModal({ open, onClose, onCreated, defaultProjectId }: CreateTaskModalProps) {
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId || "");
  const [assigneeId, setAssigneeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setProjectId(defaultProjectId || "");
    setAssigneeId("");
    setStartDate("");
    setDueDate("");
    setEstimatedHours("");
    setDescription("");
    setError("");

    (async () => {
      const [projRes, meRes] = await Promise.all([
        supabase.from("projects").select("id, name, account_id, accounts(name)").order("name"),
        supabase.auth.getUser(),
      ]);
      if (projRes.data) setProjects(projRes.data);

      const myRole = meRes.data?.user?.id
        ? (await supabase.from("profiles").select("role").eq("id", meRes.data.user.id).single()).data?.role
        : null;

      if (myRole === "DIRECTOR" && meRes.data?.user?.id) {
        const { data: myAccounts } = await supabase
          .from("profile_accounts")
          .select("account_id")
          .eq("profile_id", meRes.data.user.id);
        const accountIds = myAccounts?.map((a) => a.account_id) || [];

        if (accountIds.length > 0) {
          const { data: collaboratorIds } = await supabase
            .from("profile_accounts")
            .select("profile_id")
            .in("account_id", accountIds);
          const cids = [...new Set(collaboratorIds?.map((c) => c.profile_id) || [])];
          if (cids.length > 0) {
            const { data } = await supabase
              .from("profiles")
              .select("id, full_name")
              .in("id", cids)
              .order("full_name");
            if (data) setProfiles(data);
          } else {
            setProfiles([]);
          }
        } else {
          setProfiles([]);
        }
      } else {
        const { data } = await supabase.from("profiles").select("id, full_name").order("full_name");
        if (data) setProfiles(data);
      }
    })();
  }, [open, supabase, defaultProjectId]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("El título es requerido");
      return;
    }
    setSaving(true);
    setError("");

    const insertData: Record<string, unknown> = {
      title: title.trim(),
      status: "PENDING",
    };
    if (projectId) insertData.project_id = projectId;
    if (assigneeId) insertData.assignee_id = assigneeId;
    if (startDate) insertData.start_date = startDate;
    if (dueDate) insertData.due_date = dueDate;
    if (estimatedHours) insertData.estimated_hours = Number(estimatedHours);
    if (description) insertData.description = description;

    const { error: insertErr } = await supabase.from("tasks").insert(insertData);

    if (insertErr) {
      setError(insertErr.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div
        className="w-full max-w-lg rounded-2xl animate-slideUp"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <CheckSquare size={18} style={{ color: "var(--accent-green)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Nueva Tarea</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:opacity-70" style={{ color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(244,63,94,0.1)", color: "var(--accent-rose)" }}>
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Banner principal Q1"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Proyecto</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
              >
                <option value="">Sin proyecto</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Responsable</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
              >
                <option value="">Sin asignar</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Entrega</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Horas</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles de la tarea..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: "var(--accordion-bg)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: "var(--accent-green)" }}
            >
              {saving ? "Creando..." : "Crear Tarea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
