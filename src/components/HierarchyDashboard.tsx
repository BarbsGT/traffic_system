"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/tasks/StatusBadge";
import { Building2, Users, FolderKanban, CheckSquare, ChevronRight } from "lucide-react";

interface Agency { id: string; name: string; code: string }
interface Account { id: string; name: string; agency_id: string }
interface Team { id: string; name: string; account_id: string; director_id: string | null }
interface Project { id: string; name: string; status: string; priority: string }
interface Task { id: string; title: string; status: string; project_id: string }

type Level = "agency" | "account" | "team" | "project" | "task";

export function HierarchyDashboard() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [level, setLevel] = useState<Level>("agency");
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase.from("agencies").select("*").then(({ data }) => { if (data) setAgencies(data); });
    supabase.from("accounts").select("*").then(({ data }) => { if (data) setAccounts(data); });
    supabase.from("teams").select("*").then(({ data }) => { if (data) setTeams(data); });
    supabase.from("projects").select("*").then(({ data }) => { if (data) setProjects(data); });
    supabase.from("tasks").select("*").then(({ data }) => { if (data) setTasks(data); });
  }, [supabase]);

  const filteredAccounts = selectedAgency ? accounts.filter((a) => a.agency_id === selectedAgency) : [];
  const filteredTeams = selectedAccount ? teams.filter((t) => t.account_id === selectedAccount) : [];
  const filteredProjects = selectedTeam ? projects : [];
  const filteredTasks = selectedProject ? tasks.filter((t) => t.project_id === selectedProject) : [];

  const breadcrumbs = [
    { level: "agency" as Level, label: agencies.find((a) => a.id === selectedAgency)?.name || "Agencias" },
    ...(selectedAgency ? [{ level: "account" as Level, label: accounts.find((a) => a.id === selectedAccount)?.name || "Cuentas" }] : []),
    ...(selectedAccount ? [{ level: "team" as Level, label: teams.find((t) => t.id === selectedTeam)?.name || "Equipos" }] : []),
    ...(selectedTeam ? [{ level: "project" as Level, label: projects.find((p) => p.id === selectedProject)?.name || "Proyectos" }] : []),
    ...(selectedProject ? [{ level: "task" as Level, label: "Tareas" }] : []),
  ].filter(Boolean);

  const handleBreadcrumb = (idx: number) => {
    if (idx === 0) { setSelectedAgency(null); setSelectedAccount(null); setSelectedTeam(null); setSelectedProject(null); setLevel("agency"); }
    else if (idx === 1) { setSelectedAccount(null); setSelectedTeam(null); setSelectedProject(null); setLevel("account"); }
    else if (idx === 2) { setSelectedTeam(null); setSelectedProject(null); setLevel("team"); }
    else if (idx === 3) { setSelectedProject(null); setLevel("project"); }
  };

  return (
    <div className="animate-slideUp">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        {breadcrumbs.map((b, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />}
            <button
              onClick={() => handleBreadcrumb(i)}
              className="font-medium transition-all hover:opacity-70"
              style={{ color: i === breadcrumbs.length - 1 ? "var(--accent-cyan)" : "var(--text-secondary)" }}
            >
              {b?.label}
            </button>
          </span>
        ))}
      </div>

      {/* Level content */}
      {level === "agency" && !selectedAgency && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {agencies.map((a) => {
            const count = accounts.filter((ac) => ac.agency_id === a.id).length;
            return (
              <GlassCard key={a.id} className="p-4 cursor-pointer hover:opacity-80 transition-all" onClick={() => { setSelectedAgency(a.id); setLevel("account"); }}>
                <div className="flex items-center gap-3 mb-2">
                  <Building2 size={20} style={{ color: "var(--accent-cyan)" }} />
                  <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>{a.name}</h3>
                </div>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{count} cuentas</p>
              </GlassCard>
            );
          })}
        </div>
      )}

      {level === "account" && selectedAgency && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredAccounts.map((a) => (
            <GlassCard key={a.id} className="p-4 cursor-pointer hover:opacity-80 transition-all" onClick={() => { setSelectedAccount(a.id); setLevel("team"); }}>
              <div className="flex items-center gap-3 mb-2">
                <Users size={20} style={{ color: "var(--accent-purple)" }} />
                <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>{a.name}</h3>
              </div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{teams.filter((t) => t.account_id === a.id).length} equipos</p>
            </GlassCard>
          ))}
        </div>
      )}

      {level === "team" && selectedAccount && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredTeams.map((t) => {
            const projectCount = projects.filter((p) => true).length;
            return (
              <GlassCard key={t.id} className="p-4 cursor-pointer hover:opacity-80 transition-all" onClick={() => { setSelectedTeam(t.id); setLevel("project"); }}>
                <div className="flex items-center gap-3 mb-2">
                  <FolderKanban size={20} style={{ color: "var(--accent-green)" }} />
                  <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>{t.name}</h3>
                </div>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{projectCount} proyectos</p>
              </GlassCard>
            );
          })}
        </div>
      )}

      {level === "project" && selectedTeam && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredProjects.map((p) => (
            <GlassCard key={p.id} className="p-4 cursor-pointer hover:opacity-80 transition-all" onClick={() => { setSelectedProject(p.id); setLevel("task"); }}>
              <div className="flex items-center gap-3 mb-2">
                <CheckSquare size={20} style={{ color: "var(--accent-amber)" }} />
                <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>{p.name}</h3>
              </div>
              <StatusBadge status={p.status} />
            </GlassCard>
          ))}
        </div>
      )}

      {level === "task" && selectedProject && (
        <div className="flex flex-col gap-2">
          {filteredTasks.map((t) => (
            <GlassCard key={t.id} className="p-3 flex items-center justify-between">
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>{t.title}</span>
              <StatusBadge status={t.status} />
            </GlassCard>
          ))}
          {filteredTasks.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>Sin tareas en este proyecto</p>
          )}
        </div>
      )}

      {!selectedAgency && agencies.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>No hay datos disponibles</p>
      )}
    </div>
  );
}
