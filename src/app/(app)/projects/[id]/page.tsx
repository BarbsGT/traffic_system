"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/tasks/StatusBadge";
import { isTaskRedAlert } from "@/utils/taskAlerts";
import { Plus, MoreHorizontal } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  end_date?: string | null;
  delivered_at?: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee_id: string;
}

const columns = [
  { key: "PENDING", label: "Pendiente", color: "var(--accent-amber)" },
  { key: "IN_PROGRESS", label: "En Progreso", color: "var(--accent-cyan)" },
  { key: "REVIEW", label: "Revisión", color: "var(--accent-purple)" },
  { key: "COMPLETED", label: "Completado", color: "var(--accent-green)" },
  { key: "BLOCKED", label: "Bloqueado", color: "var(--accent-rose)" },
];

export default function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showNewTask, setShowNewTask] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    const supabase = createClient();

    supabase.from("projects").select("*").eq("id", params.id).single().then(({ data }) => {
      if (data) setProject(data);
    });

    supabase.from("tasks").select("*").eq("project_id", params.id).then(({ data }) => {
      if (data) setTasks(data);
    });

    supabase.auth.getUser().then(async ({ data: user }) => {
      if (!user.user) return;
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.user.id).maybeSingle();
      const role = profile?.role || "";
      setCanEdit(role === "SUPERADMIN" || role === "SYSADMIN" || role === "DIRECTOR" || role === "GERENTE");
    });
  }, [params.id]);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: "var(--accent-cyan)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{project.name}</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{project.description}</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowNewTask(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--accent-cyan)", color: "var(--primary-fg)" }}
          >
            <Plus size={16} /> Nueva Tarea
          </button>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="min-w-[280px] flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{col.label}</span>
                <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>{colTasks.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {colTasks.map((task) => (
                  <GlassCard key={task.id} className="p-3 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {task.title}
                      </span>
                      <MoreHorizontal size={14} style={{ color: "var(--text-muted)" }} />
                    </div>
                    <div className="mt-2">
                      <StatusBadge status={task.status} tone={isTaskRedAlert(task.status, project) ? "red" : "gray"} />
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={showNewTask} onClose={() => setShowNewTask(false)} title="Nueva Tarea">
        <NewTaskForm projectId={project.id} onClose={() => setShowNewTask(false)} />
      </Modal>
    </div>
  );
}

function NewTaskForm({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    await supabase.from("tasks").insert({
      title,
      description,
      project_id: projectId,
      created_by: user.user.id,
      status: "PENDING",
    });

    onClose();
    window.location.reload();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título de la tarea"
        required
        className="rounded-lg px-3 py-2 text-sm"
        style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripción"
        rows={3}
        className="rounded-lg px-3 py-2 text-sm"
        style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
      />
      <button
        type="submit"
        className="rounded-lg px-4 py-2 text-sm font-medium"
        style={{ background: "var(--accent-cyan)", color: "var(--primary-fg)" }}
      >
        Crear Tarea
      </button>
    </form>
  );
}
