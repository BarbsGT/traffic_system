"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";

type Tab = "usuarios" | "colaboradores" | "asignaciones";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  position: string;
  position_description: string;
  manager_id: string | null;
  capacity: number;
  is_active: boolean;
}

interface Agency { id: string; name: string }
interface Account { id: string; name: string; agency_id: string }
interface Team { id: string; name: string; account_id: string }

export default function UsersPage() {
  const [tab, setTab] = useState<Tab>("usuarios");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const supabase = createClient();

  useEffect(() => {
    supabase.from("profiles").select("*").order("full_name").then(({ data }) => {
      if (data) setProfiles(data);
    });
    supabase.from("agencies").select("*").then(({ data }) => {
      if (data) setAgencies(data);
    });
    supabase.from("accounts").select("*").then(({ data }) => {
      if (data) setAccounts(data);
    });
    supabase.from("teams").select("*").then(({ data }) => {
      if (data) setTeams(data);
    });
  }, [supabase]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "usuarios", label: "Usuarios" },
    { key: "colaboradores", label: "Colaboradores" },
    { key: "asignaciones", label: "Asignaciones" },
  ];

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Usuarios</h1>

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
            {t.label}
          </button>
        ))}
      </div>

      {tab === "usuarios" && (
        <GlassCard className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--table-header)" }}>
                {["Nombre", "Email", "Rol", "Posición", "Cuenta", "Equipo", "Manager", "Capacidad"].map((h) => (
                  <th key={h} className="p-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} style={{ borderTop: "1px solid var(--divider)" }}>
                  <td className="p-3 text-sm" style={{ color: "var(--text-primary)" }}>{p.full_name}</td>
                  <td className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>{p.email}</td>
                  <td className="p-3">
                    <span className="text-xs font-bold px-2 py-1 rounded" style={{
                      background: p.role === "SUPERADMIN" ? "rgba(244,63,94,0.15)" :
                        p.role === "SYSADMIN" ? "rgba(139,92,246,0.15)" :
                        p.role === "DIRECTOR" ? "rgba(245,158,11,0.15)" :
                        "rgba(16,185,129,0.15)",
                      color: p.role === "SUPERADMIN" ? "var(--accent-rose)" :
                        p.role === "SYSADMIN" ? "var(--accent-purple)" :
                        p.role === "DIRECTOR" ? "var(--accent-amber)" :
                        "var(--accent-green)",
                    }}>
                      {p.role}
                    </span>
                  </td>
                  <td className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>{p.position || "-"}</td>
                  <td className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>-</td>
                  <td className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>-</td>
                  <td className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {p.manager_id ? profiles.find((m) => m.id === p.manager_id)?.full_name || "-" : "-"}
                  </td>
                  <td className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>{p.capacity}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      {tab === "colaboradores" && (
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Árbol de Colaboradores</h2>
          <div className="flex flex-col gap-3">
            {profiles.filter((p) => !p.manager_id).map((root) => (
              <TreeNode key={root.id} profile={root} allProfiles={profiles} depth={0} />
            ))}
          </div>
        </GlassCard>
      )}

      {tab === "asignaciones" && (
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Asignaciones</h2>
          <p style={{ color: "var(--text-secondary)" }}>Gestión de asignaciones de usuarios a cuentas y equipos.</p>
        </GlassCard>
      )}
    </div>
  );
}

function TreeNode({ profile, allProfiles, depth }: { profile: Profile; allProfiles: Profile[]; depth: number }) {
  const children = allProfiles.filter((p) => p.manager_id === profile.id);
  return (
    <div>
      <div
        className="flex items-center gap-2 p-2 rounded-lg text-sm"
        style={{ marginLeft: depth * 20, background: "var(--card-bg)" }}
      >
        <span style={{ color: "var(--text-primary)" }}>{profile.full_name}</span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{profile.position}</span>
        <span className="text-xs px-1.5 py-0.5 rounded" style={{
          background: profile.role === "DIRECTOR" ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)",
          color: profile.role === "DIRECTOR" ? "var(--accent-amber)" : "var(--accent-green)",
        }}>
          {profile.role}
        </span>
      </div>
      {children.map((child) => (
        <TreeNode key={child.id} profile={child} allProfiles={allProfiles} depth={depth + 1} />
      ))}
    </div>
  );
}
