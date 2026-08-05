"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/tasks/StatusBadge";
import { isTaskRedAlert } from "@/utils/taskAlerts";
import { loadAgencies, loadAccounts, loadTeams, loadProfiles, type Agency, type Account, type Team, type ProfileRef } from "@/lib/directory";

interface Task {
  id: string;
  title: string;
  status: string;
  project_id: string;
  assignee_id: string | null;
  project_name?: string;
  assignee_name?: string;
}

interface Project {
  id: string;
  name: string;
  agency_name?: string;
  end_date?: string | null;
  delivered_at?: string | null;
}

const statuses = ["PENDING", "IN_PROGRESS", "REVIEW", "COMPLETED", "BLOCKED"];

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [profiles, setProfiles] = useState<ProfileRef[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedAgency, setSelectedAgency] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const supabase = createClient();

  useEffect(() => {
    Promise.all([
      supabase.from("tasks").select("*"),
      supabase.from("projects").select("id, name, end_date, delivered_at"),
      loadProfiles(),
      loadAgencies(),
      loadAccounts(),
      loadTeams(),
    ]).then(([t, p, pr, a, ac, te]) => {
      if (t.data) setTasks(t.data);
      if (p.data) setProjects(p.data);
      setProfiles(pr.map((x) => ({ id: x.id, full_name: x.full_name })));
      setAgencies(a);
      setAccounts(ac);
      setTeams(te);
    });
  }, [supabase]);

  const filteredAccounts = selectedAgency ? accounts.filter((a) => a.agency_id === selectedAgency) : accounts;
  const filteredTeams = selectedAccount ? teams.filter((t) => t.account_id === selectedAccount) : teams;

  const taskProjectMap = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    const pid = t.project_id;
    if (selectedProject && pid !== selectedProject) return acc;
    const project = projects.find((p) => p.id === pid);
    if (!project) return acc;

    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !project.name.toLowerCase().includes(search.toLowerCase())) {
      return acc;
    }
    if (statusFilter && t.status !== statusFilter) return acc;

    if (!acc[pid]) acc[pid] = [];
    acc[pid].push(t);
    return acc;
  }, {});

  const flatTasks = Object.values(taskProjectMap).flat();
  const totalPages = Math.max(1, Math.ceil(flatTasks.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageWindow = flatTasks.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  // Reagrupar solo las tareas de la página vigente, preservando orden de proyectos.
  const pagedMap = pageWindow.reduce<Record<string, Task[]>>((acc, t) => {
    if (!acc[t.project_id]) acc[t.project_id] = [];
    acc[t.project_id].push(t);
    return acc;
  }, {});

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Tareas</h1>

      {/* Filters */}
      <GlassCard className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <select value={selectedAgency} onChange={(e) => { setSelectedAgency(e.target.value); setSelectedAccount(""); setSelectedTeam(""); setPage(0); }}
            className="rounded-lg px-3 py-2 text-sm" style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
            <option value="">Agencia</option>
            {agencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={selectedAccount} onChange={(e) => { setSelectedAccount(e.target.value); setSelectedTeam(""); setPage(0); }}
            className="rounded-lg px-3 py-2 text-sm" style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
            <option value="">Cuenta</option>
            {filteredAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={selectedTeam} onChange={(e) => { setSelectedTeam(e.target.value); setPage(0); }}
            className="rounded-lg px-3 py-2 text-sm" style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
            <option value="">Equipo</option>
            {filteredTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={selectedProject} onChange={(e) => { setSelectedProject(e.target.value); setPage(0); }}
            className="rounded-lg px-3 py-2 text-sm" style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
            <option value="">Proyecto</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="rounded-lg px-3 py-2 text-sm" style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
            <option value="">Estado</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="Buscar..."
            className="rounded-lg px-3 py-2 text-sm" style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
        </div>
      </GlassCard>

      {/* Grouped by project */}
      {Object.entries(pagedMap).map(([pid, projectTasks]) => {
        const project = projects.find((p) => p.id === pid);
        return (
          <div key={pid} className="mb-6">
            <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              {project?.name || "Sin proyecto"}
              <span className="text-sm font-normal ml-2" style={{ color: "var(--text-muted)" }}>({projectTasks.length})</span>
            </h2>
            <div className="flex flex-col gap-2">
              {projectTasks.map((t) => (
                <GlassCard key={t.id} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm" style={{ color: "var(--text-primary)" }}>{t.title}</span>
                    {t.assignee_id && (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {profiles.find((p) => p.id === t.assignee_id)?.full_name || ""}
                      </span>
                    )}
                  </div>
                  <StatusBadge
                    status={t.status}
                    tone={isTaskRedAlert(t.status, project) ? "red" : "gray"}
                  />
                </GlassCard>
              ))}
            </div>
          </div>
        );
      })}

      {flatTasks.length === 0 && (
        <GlassCard className="p-8 text-center">
          <p style={{ color: "var(--text-muted)" }}>No se encontraron tareas</p>
        </GlassCard>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 rounded-xl px-4 py-3" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {flatTasks.length} tareas · Página {currentPage + 1} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-secondary)" }}>
              Anterior
            </button>
            <button onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-secondary)" }}>
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
