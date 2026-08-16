"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Modal } from "@/components/ui/Modal";
import { Edit2, Trash2, Plus, X, Check, Upload, FileDown } from "lucide-react";
import { adminCreateUser, adminUpdateUser, adminToggleActive, adminBulkCreateUsers, type CreateUserInput } from "@/app/actions/users";
import { parseCSV, downloadCSV, type CsvRow } from "@/utils/csv";
import { loadProfiles, loadAccounts, loadTeams, type UserProfile } from "@/lib/directory";
import { roleLabel } from "@/lib/utils";

type Tab = "usuarios" | "colaboradores" | "asignaciones";

type Profile = UserProfile;

interface Account { id: string; name: string; code: string }
interface Team { id: string; name: string; code: string }

interface ProfileAccount { id: string; profile_id: string; account_id: string; manager_id: string | null; assigned_at: string }
interface ProfileTeam { id: string; profile_id: string; team_id: string; assigned_at: string }

export default function UsersPage() {
  const [tab, setTab] = useState<Tab>("usuarios");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Profile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const fetchData = useCallback(async () => {
    const data = await loadProfiles();
    if (data) setProfiles(data);
    setPage(0);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.max(1, Math.ceil(profiles.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const visibleProfiles = profiles.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  const openEdit = (profile: Profile) => {
    setEditing(profile);
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    await adminToggleActive(id, false);
    setConfirmDelete(null);
    fetchData();
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "usuarios", label: "Usuarios" },
    { key: "colaboradores", label: "Colaboradores" },
    { key: "asignaciones", label: "Asignaciones" },
  ];

  const ROLE_STYLES: Record<string, { bg: string; text: string }> = {
    SUPERADMIN: { bg: "rgba(255,138,138,0.15)", text: "var(--accent-rose)" },
    SYSADMIN: { bg: "rgba(143,163,255,0.15)", text: "var(--accent-purple)" },
    DIRECTOR: { bg: "rgba(255,209,102,0.15)", text: "var(--accent-amber)" },
    GERENTE: { bg: "rgba(255,180,170,0.15)", text: "var(--accent-cyan)" },
    COLABORADOR: { bg: "rgba(125,216,125,0.15)", text: "var(--accent-green)" },
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Usuarios</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ color: "var(--accent-cyan)", background: "var(--glass-bg)", border: "1px solid var(--accent-cyan)" }}
          >
            <Upload size={16} /> Subir CSV
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#690003]"
            style={{ background: "var(--accent-cyan)" }}
          >
            <Plus size={16} /> Nuevo Usuario
          </button>
        </div>
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
              {visibleProfiles.map((p) => {
                const rs = ROLE_STYLES[p.role] || ROLE_STYLES.COLABORADOR;
                return (
                  <tr key={p.id} style={{ borderTop: "1px solid var(--divider)", opacity: p.is_active ? 1 : 0.4 }}>
                    <td className="p-3 text-sm" style={{ color: "var(--text-primary)" }}>{p.full_name}</td>
                    <td className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>{p.email}</td>
                    <td className="p-3">
                      <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: rs.bg, color: rs.text }}>
                        {roleLabel(p.role)}
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
              {visibleProfiles.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    Sin usuarios
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--divider)" }}>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {profiles.length} usuarios · Página {currentPage + 1} de {totalPages}
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
              className="px-4 py-2 rounded-lg text-sm font-semibold text-[#131313]" style={{ background: "var(--accent-rose)" }}>
              Desactivar
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nuevo Usuario">
        <CreateUserForm profiles={profiles} onDone={() => { setShowCreateModal(false); fetchData(); }} />
      </Modal>

      <Modal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} title="Carga masiva de usuarios (CSV)">
        <BulkUsersForm profiles={profiles} />
      </Modal>
    </div>
  );
}

const VALID_ROLES = ["COLABORADOR", "DIRECTOR", "GERENTE", "SYSADMIN", "SUPERADMIN"] as const;
const MIN_PASSWORD_LENGTH = 8;

const BULK_TEMPLATE = [
  "email,password,full_name,role,position,position_description,capacity,manager_email,accounts,teams",
  "juan@correo.com,Contrasena123,Juan Pérez,COLABORADOR,Diseñador,Area creativa,100,maria.directora@agenciacentral.com,CUENTA-001;CUENTA-002,EQUIPO-001",
];

function BulkUsersForm({ profiles }: { profiles: Profile[] }) {
  const supabase = createClient();
  const [csvText, setCsvText] = useState("");
  const [parsed, setParsed] = useState<CsvRow[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ created: number; errors: { row: number; email: string; error: string }[] } | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("accounts").select("id, name, code").order("name"),
      supabase.from("teams").select("id, name, code").order("name"),
    ]).then(([accRes, teamRes]) => {
      if (accRes.data) setAccounts(accRes.data);
      if (teamRes.data) setTeams(teamRes.data);
    });
  }, [supabase]);

  const accountByName = (v: string) => accounts.find((a) => a.name.toLowerCase() === v.toLowerCase() || a.code.toLowerCase() === v.toLowerCase());
  const teamByName = (v: string) => teams.find((t) => t.name.toLowerCase() === v.toLowerCase() || t.code.toLowerCase() === v.toLowerCase());
  const profileByEmail = (v: string) => profiles.find((p) => p.email.toLowerCase() === v.toLowerCase());
  const profileByName = (v: string) => profiles.find((p) => p.full_name.toLowerCase() === v.toLowerCase());

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setCsvText(text);
      setParsed(parseCSV(text));
      setResult(null);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (parsed.length === 0) return;
    setSaving(true);
    setResult(null);

    const inputs: CreateUserInput[] = [];
    const errors: { row: number; email: string; error: string }[] = [];

    parsed.forEach((row, idx) => {
      const rowNumber = idx + 2;
      const email = (row.email || "").trim();
      const full_name = (row.full_name || "").trim();
      const password = row.password || "";
      const role = ((row.role || "COLABORADOR").toUpperCase()) as CreateUserInput["role"];

      const managerRef = (row.manager_email || "").trim();
      const manager = managerRef ? (profileByEmail(managerRef) || profileByName(managerRef)) : undefined;
      if (managerRef && !manager) {
        errors.push({ row: rowNumber, email, error: `Manager "${managerRef}" no encontrado` });
        return;
      }

      const accountInputs = (row.accounts || "")
        .split(/[;|]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name) => accountByName(name))
        .filter((a) => !!a) as Account[];
      const unknownAccounts = (row.accounts || "").split(/[;|]/).map((s) => s.trim()).filter(Boolean).filter((n) => !accountByName(n));
      if (unknownAccounts.length > 0) {
        errors.push({ row: rowNumber, email, error: `Cuentas no encontradas: ${unknownAccounts.join(", ")}` });
        return;
      }

      const teamIds = (row.teams || "")
        .split(/[;|]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((n) => !teamByName(n));
      if (teamIds.length > 0) {
        errors.push({ row: rowNumber, email, error: `Equipos no encontrados: ${teamIds.join(", ")}` });
        return;
      }
      const teamsSelected = (row.teams || "").split(/[;|]/).map((s) => s.trim()).filter(Boolean).map((n) => teamByName(n)!.id);

      inputs.push({
        email,
        password,
        full_name,
        role: VALID_ROLES.includes(role) ? role : "COLABORADOR",
        position: row.position || "",
        position_description: row.position_description || "",
        manager_id: manager?.id || null,
        capacity: parseInt(row.capacity || "100") || 100,
        accounts: accountInputs.map((a) => ({ account_id: a.id, manager_id: null })),
        teams: teamsSelected,
      });
    });

    if (errors.length > 0) {
      setSaving(false);
      setResult({ created: 0, errors });
      return;
    }

    const res = await adminBulkCreateUsers(inputs);
    setSaving(false);
    setResult({ created: res.created, errors: res.errors });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
        Sube un archivo CSV con las columnas: <code className="px-1 rounded" style={{ background: "var(--accordion-bg)" }}>email,password,full_name,role,position,position_description,capacity,manager_email,accounts,teams</code>.
        Usa <code className="px-1 rounded" style={{ background: "var(--accordion-bg)" }}>;</code> para separar múltiples cuentas o equipos. El manager, cuentas y equipos se resuelven por nombre, código o email.
      </div>

      <button
        onClick={() => downloadCSV("plantilla_usuarios.csv", BULK_TEMPLATE.join("\n"))}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium w-fit"
        style={{ color: "var(--accent-cyan)", background: "var(--glass-bg)", border: "1px solid var(--accent-cyan)" }}
      >
        <FileDown size={14} /> Descargar plantilla CSV
      </button>

      <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl cursor-pointer border border-dashed"
        style={{ background: "var(--card-bg)", borderColor: "var(--input-border)" }}>
        <Upload size={20} style={{ color: "var(--text-muted)" }} />
        <span className="text-sm" style={{ color: "var(--text-primary)" }}>Seleccionar archivo CSV</span>
        <input type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
      </label>

      {csvText && (
        <textarea
          value={csvText}
          onChange={(e) => { setCsvText(e.target.value); setParsed(parseCSV(e.target.value)); setResult(null); }}
          rows={6}
          placeholder="O pega aquí el contenido CSV..."
          className="rounded-lg px-3 py-2 text-xs font-mono outline-none"
          style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
        />
      )}

      {parsed.length > 0 && (
        <div className="text-xs" style={{ color: "var(--text-primary)" }}>
          <strong>{parsed.length}</strong> registros detectados
        </div>
      )}

      {result && (
        <div className="rounded-lg p-3 text-xs flex flex-col gap-2 max-h-48 overflow-y-auto"
          style={{ background: "var(--card-bg)", border: "1px solid var(--input-border)" }}>
          <div style={{ color: "var(--accent-green)" }}>{result.created} usuarios creados</div>
          {result.errors.length > 0 && (
            <>
              <div style={{ color: "var(--accent-rose)" }}>{result.errors.length} errores:</div>
              {result.errors.map((err, i) => (
                <div key={i} style={{ color: "var(--accent-rose)" }}>
                  Fila {err.row}{err.email ? ` (${err.email})` : ""}: {err.error}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <button onClick={handleSubmit} disabled={saving || parsed.length === 0}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-[#690003] disabled:opacity-50"
          style={{ background: "var(--accent-cyan)" }}>
          {saving ? "Creando usuarios..." : "Crear usuarios"}
        </button>
      </div>
    </div>
  );
}

function CreateUserForm({ profiles, onDone }: { profiles: Profile[]; onDone: () => void }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<Record<string, string>>({});
  const [selectedTeams, setSelectedTeams] = useState<Record<string, boolean>>({});

  useEffect(() => {
    Promise.all([
      supabase.from("accounts").select("id, name, code").order("name"),
      supabase.from("teams").select("id, name, code, account_id").order("name"),
    ]).then(([accRes, teamRes]) => {
      if (accRes.data) setAccounts(accRes.data);
      if (teamRes.data) setTeams(teamRes.data);
    });
  }, [supabase]);

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) => {
      const next = { ...prev };
      if (id in next) delete next[id];
      else next[id] = "";
      return next;
    });
  };

  const toggleTeam = (id: string) => {
    setSelectedTeams((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const form = e.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form));

    const res = await adminCreateUser({
      email: data.email as string,
      password: data.password as string,
      full_name: data.full_name as string,
      role: (data.role as string) as "COLABORADOR" | "DIRECTOR" | "GERENTE" | "SYSADMIN" | "SUPERADMIN",
      position: data.position as string,
      position_description: data.position_description as string,
      manager_id: (data.manager_id as string) || null,
      capacity: parseInt(data.capacity as string) || 100,
      accounts: Object.entries(selectedAccounts).map(([account_id, manager_id]) => ({ account_id, manager_id: manager_id || null })),
      teams: Object.entries(selectedTeams).filter(([, v]) => v).map(([team_id]) => team_id),
    });

    if (!res.ok) {
      setError(res.error);
      setSaving(false);
      return;
    }

    setSaving(false);
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
      {error && (
        <div className="px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(255,138,138,0.1)", color: "var(--accent-rose)" }}>
          {error}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Nombre completo *</label>
        <input name="full_name" required
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Email *</label>
          <input name="email" type="email" required
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Contraseña *</label>
          <input name="password" type="password" required minLength={MIN_PASSWORD_LENGTH}
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Rol</label>
          <select name="role" defaultValue="COLABORADOR"
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
            <option value="COLABORADOR">Colaborador</option>
            <option value="DIRECTOR">Director</option>
            <option value="GERENTE">Gerente</option>
            <option value="SYSADMIN">Sys Admin</option>
            <option value="SUPERADMIN">Super Admin</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Capacidad (%)</label>
          <input name="capacity" type="number" min={0} max={100} defaultValue={100}
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Posición</label>
        <input name="position"
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Descripción de posición</label>
        <input name="position_description"
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Manager global (default)</label>
        <select name="manager_id" defaultValue=""
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
          <option value="">Sin manager</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.full_name}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl p-3" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
        <h4 className="text-xs font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Cuentas asignadas (cada cuenta puede tener su propio manager/director)</h4>
        <div className="flex flex-col gap-1.5">
          {accounts.length === 0 && <p className="text-xs" style={{ color: "var(--text-muted)" }}>No hay cuentas creadas. Créalas en Catálogos.</p>}
          {accounts.map((a) => {
            const checked = a.id in selectedAccounts;
            return (
              <div key={a.id} className="flex items-center gap-2">
                <button type="button" onClick={() => toggleAccount(a.id)}
                  className="flex items-center gap-2 px-2 py-1 rounded text-xs transition-all flex-1"
                  style={{ background: checked ? "rgba(255,180,170,0.12)" : "var(--accordion-bg)", border: `1px solid ${checked ? "var(--accent-cyan)" : "var(--border)"}` }}>
                  <span className="w-3.5 h-3.5 rounded border flex items-center justify-center"
                    style={{ borderColor: checked ? "var(--accent-cyan)" : "var(--text-muted)" }}>
                    {checked && <Check size={10} style={{ color: "var(--accent-cyan)" }} />}
                  </span>
                  <span style={{ color: "var(--text-primary)" }}>{a.name}</span>
                </button>
                {checked && (
                  <select value={selectedAccounts[a.id]}
                    onChange={(e) => setSelectedAccounts((prev) => ({ ...prev, [a.id]: e.target.value }))}
                    className="px-2 py-1 rounded text-xs outline-none"
                    style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
                    <option value="">Sin manager</option>
                    {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl p-3" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
        <h4 className="text-xs font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Equipos asignados</h4>
        <div className="flex flex-col gap-1.5">
          {teams.length === 0 && <p className="text-xs" style={{ color: "var(--text-muted)" }}>No hay equipos creados. Créalos en Catálogos.</p>}
          {teams.map((t) => {
            const checked = !!selectedTeams[t.id];
            return (
              <button key={t.id} type="button" onClick={() => toggleTeam(t.id)}
                className="flex items-center gap-2 px-2 py-1 rounded text-xs transition-all"
style={{ background: checked ? "rgba(255,180,170,0.12)" : "var(--accordion-bg)", border: `1px solid ${checked ? "var(--accent-cyan)" : "var(--border)"}` }}>
                  <span className="w-3.5 h-3.5 rounded border flex items-center justify-center"
                  style={{ borderColor: checked ? "var(--accent-cyan)" : "var(--text-muted)" }}>
                  {checked && <Check size={10} style={{ color: "var(--accent-cyan)" }} />}
                </span>
                <span style={{ color: "var(--text-primary)" }}>{t.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 justify-end sticky bottom-0 py-2" style={{ background: "var(--card-bg)" }}>
        <button type="submit" disabled={saving}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-[#690003] disabled:opacity-50"
          style={{ background: "var(--accent-cyan)" }}>
          {saving ? "Creando..." : "Crear Usuario"}
        </button>
      </div>
    </form>
  );
}

function UserEditForm({ profile, profiles, onDone }: { profile: Profile | null; profiles: Profile[]; onDone: () => void }) {
  const [saving, setSaving] = useState(false);

  if (!profile) return null;

  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const form = e.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form));

    const role = data.role as string;
    if (!VALID_ROLES.includes(role as typeof VALID_ROLES[number])) {
      setError("Rol no válido");
      setSaving(false);
      return;
    }

    const capacity = parseInt(data.capacity as string) || 100;
    if (capacity < 0 || capacity > 100) {
      setError("La capacidad debe ser entre 0 y 100");
      setSaving(false);
      return;
    }

    const res = await adminUpdateUser(profile.id, {
      role: role as "COLABORADOR" | "DIRECTOR" | "GERENTE" | "SYSADMIN" | "SUPERADMIN",
      position: data.position as string,
      position_description: data.position_description as string,
      manager_id: (data.manager_id as string) || null,
      capacity,
    });

    if (!res.ok) {
      setError(res.error);
      setSaving(false);
      return;
    }

    setSaving(false);
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(255,138,138,0.1)", color: "var(--accent-rose)" }}>
          {error}
        </div>
      )}
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
          <option value="COLABORADOR">Colaborador</option>
          <option value="DIRECTOR">Director</option>
          <option value="GERENTE">Gerente</option>
          <option value="SYSADMIN">Sys Admin</option>
          <option value="SUPERADMIN">Super Admin</option>
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
        <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Capacidad (%)</label>
        <input name="capacity" type="number" min={0} max={100} defaultValue={profile.capacity}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="submit" disabled={saving}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-[#690003] disabled:opacity-50"
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
  const accountSelectRef = useRef<HTMLSelectElement>(null);
  const teamSelectRef = useRef<HTMLSelectElement>(null);

  const refresh = useCallback(async () => {
    const [acRes, tRes, paRes, ptRes] = await Promise.all([
      supabase.from("accounts").select("id, name, code").order("name"),
      supabase.from("teams").select("id, name, code").order("name"),
      selectedUser ? supabase.from("profile_accounts").select("*").eq("profile_id", selectedUser) : Promise.resolve({ data: [] as ProfileAccount[] }),
      selectedUser ? supabase.from("profile_teams").select("*").eq("profile_id", selectedUser) : Promise.resolve({ data: [] as ProfileTeam[] }),
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

  const setAccountManager = async (pa: ProfileAccount, managerId: string) => {
    setSaving(true);
    await supabase.from("profile_accounts").update({ manager_id: managerId || null }).eq("id", pa.id);
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
                  <div key={pa.id} className="flex flex-col gap-1 px-3 py-2 rounded-lg text-sm"
                    style={{ background: "var(--accordion-bg)" }}>
                    <div className="flex items-center justify-between">
                      <span style={{ color: "var(--text-primary)" }}>{acc?.name || pa.account_id}</span>
                      <button onClick={() => removeAccount(pa.id)} disabled={saving}
                        className="p-1 rounded hover:opacity-70" style={{ color: "var(--accent-rose)" }}>
                        <X size={14} />
                      </button>
                    </div>
                    <select value={pa.manager_id || ""}
                      onChange={(e) => setAccountManager(pa, e.target.value)}
                      disabled={saving}
                      className="w-full px-2 py-1 rounded text-xs outline-none"
                      style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
                      <option value="">Sin manager</option>
                      {profiles.filter((p) => p.id !== pa.profile_id).map((p) => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
              {profileAccounts.length === 0 && (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Sin cuentas asignadas</p>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <select ref={accountSelectRef} id="add-account"
                className="flex-1 px-2 py-1.5 rounded text-xs outline-none"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
                <option value="">-- Agregar cuenta --</option>
                {availableAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <button onClick={() => {
                if (accountSelectRef.current) {
                  addAccount(accountSelectRef.current.value);
                  accountSelectRef.current.value = "";
                }
              }} disabled={saving}
                className="px-3 py-1.5 rounded text-xs font-semibold text-[#690003] disabled:opacity-50"
                style={{ background: "var(--accent-cyan)" }}>+</button>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Equipos asignados</h3>
            <div className="flex flex-col gap-2">
              {profileTeams.map((pt) => {
                const tm = teams.find((t) => t.id === pt.team_id);
                return (
                  <div key={pt.id} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
                    style={{ background: "var(--accordion-bg)" }}>
                    <span style={{ color: "var(--text-primary)" }}>{tm?.name || pt.team_id}</span>
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
              <select ref={teamSelectRef} id="add-team"
                className="flex-1 px-2 py-1.5 rounded text-xs outline-none"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
                <option value="">-- Agregar equipo --</option>
                {availableTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <button onClick={() => {
                if (teamSelectRef.current) {
                  addTeam(teamSelectRef.current.value);
                  teamSelectRef.current.value = "";
                }
              }} disabled={saving}
                className="px-3 py-1.5 rounded text-xs font-semibold text-[#690003] disabled:opacity-50"
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
          background: profile.role === "DIRECTOR" || profile.role === "GERENTE" ? "rgba(255,209,102,0.15)" : "rgba(125,216,125,0.15)",
          color: profile.role === "DIRECTOR" || profile.role === "GERENTE" ? "var(--accent-amber)" : "var(--accent-green)",
        }}>
          {roleLabel(profile.role)}
        </span>
      </div>
      {children.map((child) => (
        <TreeNode key={child.id} profile={child} allProfiles={allProfiles} depth={depth + 1} />
      ))}
    </div>
  );
}
