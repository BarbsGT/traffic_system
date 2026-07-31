"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Modal } from "@/components/ui/Modal";
import { Edit2, Trash2, Plus, X } from "lucide-react";

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

interface Account { id: string; name: string; code: string }
interface Team { id: string; name: string; code: string; account_id: string }

interface ProfileAccount { id: string; profile_id: string; account_id: string; assigned_at: string }
interface ProfileTeam { id: string; profile_id: string; team_id: string; assigned_at: string }

export default function UsersPage() {
  const [tab, setTab] = useState<Tab>("usuarios");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Profile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("*").order("full_name");
    if (data) setProfiles(data);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = (profile: Profile) => {
    setEditing(profile);
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("profiles").update({ is_active: false }).eq("id", id);
    setConfirmDelete(null);
    fetchData();
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "usuarios", label: "Usuarios" },
    { key: "colaboradores", label: "Colaboradores" },
    { key: "asignaciones", label: "Asignaciones" },
  ];

  const ROLE_STYLES: Record<string, { bg: string; text: string }> = {
    SUPERADMIN: { bg: "rgba(244,63,94,0.15)", text: "var(--accent-rose)" },
    SYSADMIN: { bg: "rgba(139,92,246,0.15)", text: "var(--accent-purple)" },
    DIRECTOR: { bg: "rgba(245,158,11,0.15)", text: "var(--accent-amber)" },
    COLABORADOR: { bg: "rgba(16,185,129,0.15)", text: "var(--accent-green)" },
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Usuarios</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "var(--accent-cyan)" }}
        >
          <Plus size={16} /> Nuevo Usuario
        </button>
      </div>

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
                {["Nombre", "Email", "Rol", "Posición", "Manager", "Capacidad", "Activo", ""].map((h) => (
                  <th key={h} className="p-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const rs = ROLE_STYLES[p.role] || ROLE_STYLES.COLABORADOR;
                return (
                  <tr key={p.id} style={{ borderTop: "1px solid var(--divider)", opacity: p.is_active ? 1 : 0.4 }}>
                    <td className="p-3 text-sm" style={{ color: "var(--text-primary)" }}>{p.full_name}</td>
                    <td className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>{p.email}</td>
                    <td className="p-3">
                      <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: rs.bg, color: rs.text }}>
                        {p.role}
                      </span>
                    </td>
                    <td className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>{p.position || "-"}</td>
                    <td className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                      {p.manager_id ? profiles.find((m) => m.id === p.manager_id)?.full_name || "-" : "-"}
                    </td>
                    <td className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>{p.capacity}%</td>
                    <td className="p-3 text-sm">{p.is_active ? "✓" : "✗"}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:opacity-70 inline-flex" style={{ color: "var(--accent-cyan)" }} title="Editar">
                        <Edit2 size={14} />
                      </button>
                      {p.is_active && (
                        <button onClick={() => setConfirmDelete(p)} className="p-1.5 rounded hover:opacity-70 inline-flex" style={{ color: "var(--accent-rose)" }} title="Desactivar">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {profiles.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    Sin usuarios
                  </td>
                </tr>
              )}
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
        <AssignmentsTab profiles={profiles} />
      )}

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Editar Usuario">
        <UserEditForm profile={editing} profiles={profiles} onDone={() => { setShowEditModal(false); fetchData(); }} />
      </Modal>

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Desactivar Usuario">
        <div className="flex flex-col gap-4">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            ¿Desactivar a <strong style={{ color: "var(--text-primary)" }}>{confirmDelete?.full_name}</strong>?
          </p>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-lg text-sm" style={{ color: "var(--text-muted)" }}>Cancelar</button>
            <button onClick={() => handleDelete(confirmDelete!.id)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--accent-rose)" }}>
              Desactivar
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nuevo Usuario">
        <CreateUserForm onDone={() => { setShowCreateModal(false); fetchData(); }} />
      </Modal>
    </div>
  );
}

function CreateUserForm({ onDone }: { onDone: () => void }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const form = e.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form));

    const { error: signUpErr } = await supabase.auth.signUp({
      email: data.email as string,
      password: data.password as string,
      options: {
        data: { full_name: data.full_name as string },
      },
    });

    if (signUpErr) {
      setError(signUpErr.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(244,63,94,0.1)", color: "var(--accent-rose)" }}>
          {error}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Nombre completo</label>
        <input name="full_name" required
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Email</label>
        <input name="email" type="email" required
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Contraseña</label>
        <input name="password" type="password" required
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="submit" disabled={saving}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--accent-cyan)" }}>
          {saving ? "Creando..." : "Crear Usuario"}
        </button>
      </div>
    </form>
  );
}

function UserEditForm({ profile, profiles, onDone }: { profile: Profile | null; profiles: Profile[]; onDone: () => void }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);

  if (!profile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const form = e.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form));

    await supabase.from("profiles").update({
      role: data.role,
      position: data.position,
      position_description: data.position_description,
      manager_id: data.manager_id || null,
      capacity: parseInt(data.capacity as string) || 100,
    }).eq("id", profile.id);

    setSaving(false);
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Nombre</label>
        <input value={profile.full_name} disabled
          className="rounded-lg px-3 py-2 text-sm outline-none opacity-60"
          style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Email</label>
        <input value={profile.email} disabled
          className="rounded-lg px-3 py-2 text-sm outline-none opacity-60"
          style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Rol</label>
        <select name="role" defaultValue={profile.role}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
          <option value="COLABORADOR">COLABORADOR</option>
          <option value="DIRECTOR">DIRECTOR</option>
          <option value="SYSADMIN">SYSADMIN</option>
          <option value="SUPERADMIN">SUPERADMIN</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Posición</label>
        <input name="position" defaultValue={profile.position}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Descripción de posición</label>
        <input name="position_description" defaultValue={profile.position_description}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Manager</label>
        <select name="manager_id" defaultValue={profile.manager_id || ""}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
          <option value="">Sin manager</option>
          {profiles.filter((p) => p.id !== profile.id).map((p) => (
            <option key={p.id} value={p.id}>{p.full_name}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Capacidad (horas)</label>
        <input name="capacity" type="number" defaultValue={profile.capacity}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="submit" disabled={saving}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--accent-cyan)" }}>
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

function AssignmentsTab({ profiles }: { profiles: Profile[] }) {
  const supabase = createClient();
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [profileAccounts, setProfileAccounts] = useState<ProfileAccount[]>([]);
  const [profileTeams, setProfileTeams] = useState<ProfileTeam[]>([]);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const [acRes, tRes, paRes, ptRes] = await Promise.all([
      supabase.from("accounts").select("id, name, code").order("name"),
      supabase.from("teams").select("id, name, code, account_id").order("name"),
      selectedUser ? supabase.from("profile_accounts").select("*").eq("profile_id", selectedUser) : { data: [] },
      selectedUser ? supabase.from("profile_teams").select("*").eq("profile_id", selectedUser) : { data: [] },
    ]);
    if (acRes.data) setAccounts(acRes.data);
    if (tRes.data) setTeams(tRes.data);
    if (paRes.data) setProfileAccounts(paRes.data);
    if (ptRes.data) setProfileTeams(ptRes.data);
  }, [supabase, selectedUser]);

  useEffect(() => { refresh(); }, [refresh]);

  const addAccount = async (accountId: string) => {
    if (!selectedUser || !accountId) return;
    setSaving(true);
    await supabase.from("profile_accounts").insert({ profile_id: selectedUser, account_id: accountId });
    setSaving(false);
    refresh();
  };

  const removeAccount = async (id: string) => {
    setSaving(true);
    await supabase.from("profile_accounts").delete().eq("id", id);
    setSaving(false);
    refresh();
  };

  const addTeam = async (teamId: string) => {
    if (!selectedUser || !teamId) return;
    setSaving(true);
    await supabase.from("profile_teams").insert({ profile_id: selectedUser, team_id: teamId });
    setSaving(false);
    refresh();
  };

  const removeTeam = async (id: string) => {
    setSaving(true);
    await supabase.from("profile_teams").delete().eq("id", id);
    setSaving(false);
    refresh();
  };

  const availableAccounts = accounts.filter((a) => !profileAccounts.some((pa) => pa.account_id === a.id));
  const availableTeams = teams.filter((t) => !profileTeams.some((pt) => pt.team_id === t.id));

  return (
    <div className="flex flex-col gap-4">
      <GlassCard className="p-4">
        <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-secondary)" }}>Seleccionar usuario</label>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
        >
          <option value="">-- Seleccionar --</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
          ))}
        </select>
      </GlassCard>

      {selectedUser && (
        <div className="grid grid-cols-2 gap-4">
          <GlassCard className="p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Cuentas asignadas</h3>
            <div className="flex flex-col gap-2">
              {profileAccounts.map((pa) => {
                const acc = accounts.find((a) => a.id === pa.account_id);
                return (
                  <div key={pa.id} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
                    style={{ background: "var(--accordion-bg)" }}>
                    <span style={{ color: "var(--text-primary)" }}>{acc?.name || pa.account_id}</span>
                    <button onClick={() => removeAccount(pa.id)} disabled={saving}
                      className="p-1 rounded hover:opacity-70" style={{ color: "var(--accent-rose)" }}>
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
              {profileAccounts.length === 0 && (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Sin cuentas asignadas</p>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <select id="add-account"
                className="flex-1 px-2 py-1.5 rounded text-xs outline-none"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
                <option value="">-- Agregar cuenta --</option>
                {availableAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <button onClick={() => {
                const sel = document.getElementById("add-account") as HTMLSelectElement;
                addAccount(sel.value); sel.value = "";
              }} disabled={saving}
                className="px-3 py-1.5 rounded text-xs font-semibold text-white disabled:opacity-50"
                style={{ background: "var(--accent-cyan)" }}>+</button>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Equipos asignados</h3>
            <div className="flex flex-col gap-2">
              {profileTeams.map((pt) => {
                const tm = teams.find((t) => t.id === pt.team_id);
                const acc = tm ? accounts.find((a) => a.id === tm.account_id) : null;
                return (
                  <div key={pt.id} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
                    style={{ background: "var(--accordion-bg)" }}>
                    <span style={{ color: "var(--text-primary)" }}>{tm?.name || pt.team_id} {acc && <span style={{ color: "var(--text-muted)" }}>({acc.name})</span>}</span>
                    <button onClick={() => removeTeam(pt.id)} disabled={saving}
                      className="p-1 rounded hover:opacity-70" style={{ color: "var(--accent-rose)" }}>
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
              {profileTeams.length === 0 && (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Sin equipos asignados</p>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <select id="add-team"
                className="flex-1 px-2 py-1.5 rounded text-xs outline-none"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
                <option value="">-- Agregar equipo --</option>
                {availableTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({accounts.find((a) => a.id === t.account_id)?.name || ""})
                  </option>
                ))}
              </select>
              <button onClick={() => {
                const sel = document.getElementById("add-team") as HTMLSelectElement;
                addTeam(sel.value); sel.value = "";
              }} disabled={saving}
                className="px-3 py-1.5 rounded text-xs font-semibold text-white disabled:opacity-50"
                style={{ background: "var(--accent-cyan)" }}>+</button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

function TreeNode({ profile, allProfiles, depth }: { profile: Profile; allProfiles: Profile[]; depth: number }) {
  const children = allProfiles.filter((p) => p.manager_id === profile.id);
  return (
    <div>
      <div className="flex items-center gap-2 p-2 rounded-lg text-sm"
        style={{ marginLeft: depth * 20, background: "var(--card-bg)" }}>
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
