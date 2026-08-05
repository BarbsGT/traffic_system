"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Modal } from "@/components/ui/Modal";
import { Plus, Edit2, Trash2, X, Upload, FileDown } from "lucide-react";
import { parseCSV, downloadCSV, csvToBool, type CsvRow } from "@/utils/csv";

type Tab = "agencies" | "accounts" | "teams" | "directors" | "areas" | "assignments";

interface Area { id: string; name: string; code: string; is_active: boolean }
interface Agency { id: string; name: string; code: string; is_active: boolean }
interface Account { id: string; name: string; agency_id: string; code: string; is_active: boolean }
interface Team { id: string; name: string; code: string; is_active: boolean; director_id: string | null }
interface Director { id: string; profile_id: string; account_id: string | null; is_active: boolean; name?: string }
interface TeamAssignment { team_id: string; team_name: string; account_ids: string[] }

type CatalogItem = Area | Agency | Account | Team | Director;
type CatalogFormData = Record<string, unknown>;

export default function CatalogosPage() {
  const [tab, setTab] = useState<Tab>("agencies");
  const [areas, setAreas] = useState<Area[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [directors, setDirectors] = useState<Director[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; full_name: string }[]>([]);
  const [assignments, setAssignments] = useState<TeamAssignment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [editing, setEditing] = useState<unknown>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ table: string; id: string; name: string } | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const [ar, a, ac, t, d, p] = await Promise.all([
      supabase.from("areas").select("*").order("name"),
      supabase.from("agencies").select("*").order("name"),
      supabase.from("accounts").select("*").order("name"),
      supabase.from("teams").select("*").order("name"),
      supabase.from("directors").select("*"),
      supabase.from("profiles").select("id, full_name").order("full_name"),
    ]);
    if (ar.data) setAreas(ar.data);
    if (a.data) setAgencies(a.data);
    if (ac.data) setAccounts(ac.data);
    if (t.data) setTeams(t.data);
    if (d.data) setDirectors(d.data);
    if (p.data) setProfiles(p.data);

    const { data: ta } = await supabase
      .from("team_accounts")
      .select("team_id, account_id");
    const grouped: Record<string, string[]> = {};
    if (ta) {
      ta.forEach((r) => {
        grouped[r.team_id] = grouped[r.team_id] || [];
        grouped[r.team_id].push(r.account_id);
      });
    }
    setAssignments(
      (t.data || []).map((team) => ({
        team_id: team.id,
        team_name: team.name,
        account_ids: grouped[team.id] || [],
      }))
    );
    setPage(0);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (table: string, id: string) => {
    await supabase.from(table).delete().eq("id", id);
    setConfirmDelete(null);
    fetchData();
  };

  const openEdit = (item: unknown) => {
    setEditing(item);
    if (tab === "assignments") {
      setShowAssignmentModal(true);
    } else {
      setShowModal(true);
    }
  };

  const openCreate = () => {
    setEditing(null);
    if (tab === "assignments") {
      setShowAssignmentModal(true);
    } else {
      setShowModal(true);
    }
  };

  const getTableName = (t: Tab) => {
    if (t === "areas") return "areas";
    if (t === "agencies") return "agencies";
    if (t === "accounts") return "accounts";
    if (t === "teams") return "teams";
    return "directors";
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "agencies", label: "Agencias" },
    { key: "accounts", label: "Cuentas" },
    { key: "teams", label: "Equipos" },
    { key: "assignments", label: "Asignación Equipos" },
    { key: "areas", label: "Áreas" },
    { key: "directors", label: "Directores de Cuenta" },
  ];

  const currentData = tab === "areas" ? areas : tab === "agencies" ? agencies : tab === "accounts" ? accounts : tab === "teams" ? teams : tab === "assignments" ? [] : directors;
  const totalPages = Math.max(1, Math.ceil(currentData.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageStart = currentPage * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;
  const visibleAreas = areas.slice(pageStart, pageEnd);
  const visibleAgencies = agencies.slice(pageStart, pageEnd);
  const visibleAccounts = accounts.slice(pageStart, pageEnd);
  const visibleTeams = teams.slice(pageStart, pageEnd);
  const visibleDirectors = directors.slice(pageStart, pageEnd);

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Catálogos</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ color: "var(--accent-cyan)", background: "var(--glass-bg)", border: "1px solid var(--accent-cyan)" }}
          >
            <Upload size={16} /> Subir CSV
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "var(--accent-cyan)" }}
          >
            <Plus size={16} /> Nuevo
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

      <GlassCard className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ background: "var(--table-header)" }}>
              {tab === "areas" && <Headers cols={["Nombre", "Código", "Activo"]} />}
              {tab === "agencies" && <Headers cols={["Nombre", "Código", "Activo"]} />}
              {tab === "accounts" && <Headers cols={["Nombre", "Agencia", "Código", "Activo"]} />}
              {tab === "teams" && <Headers cols={["Nombre", "Código", "Director", "Activo"]} />}
              {tab === "directors" && <Headers cols={["Perfil", "Cuenta / Marca", "Activo"]} />}
              {tab === "assignments" && <Headers cols={["Equipo", "Cuentas Asignadas", "Acción"]} />}
              <th className="p-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)", width: 80 }}>
                Acción
              </th>
            </tr>
          </thead>
          <tbody>
            {tab === "areas" && visibleAreas.map((item) => (
              <Row key={item.id} item={item} onEdit={openEdit} onDelete={() => setConfirmDelete({ table: "areas", id: item.id, name: item.name })}>
                <td className="p-3 text-sm" style={{ color: "var(--text-primary)" }}>{item.name}</td>
                <td className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>{item.code}</td>
                <td className="p-3 text-sm">{item.is_active ? "✓" : "✗"}</td>
              </Row>
            ))}
            {tab === "agencies" && visibleAgencies.map((item) => (
              <Row key={item.id} item={item} onEdit={openEdit} onDelete={() => setConfirmDelete({ table: "agencies", id: item.id, name: item.name })}>
                <td className="p-3 text-sm" style={{ color: "var(--text-primary)" }}>{item.name}</td>
                <td className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>{item.code}</td>
                <td className="p-3 text-sm">{item.is_active ? "✓" : "✗"}</td>
              </Row>
            ))}
            {tab === "accounts" && visibleAccounts.map((item) => (
              <Row key={item.id} item={item} onEdit={openEdit} onDelete={() => setConfirmDelete({ table: "accounts", id: item.id, name: item.name })}>
                <td className="p-3 text-sm" style={{ color: "var(--text-primary)" }}>{item.name}</td>
                <td className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {agencies.find((ag) => ag.id === item.agency_id)?.name || "-"}
                </td>
                <td className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>{item.code}</td>
                <td className="p-3 text-sm">{item.is_active ? "✓" : "✗"}</td>
              </Row>
            ))}
            {tab === "teams" && visibleTeams.map((item) => (
              <Row key={item.id} item={item} onEdit={openEdit} onDelete={() => setConfirmDelete({ table: "teams", id: item.id, name: item.name })}>
                <td className="p-3 text-sm" style={{ color: "var(--text-primary)" }}>{item.name}</td>
                <td className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>{item.code}</td>
                <td className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {profiles.find((p) => p.id === item.director_id)?.full_name || "-"}
                </td>
                <td className="p-3 text-sm">{item.is_active ? "✓" : "✗"}</td>
              </Row>
            ))}
            {tab === "directors" && visibleDirectors.map((item) => (
              <Row key={item.id} item={item} onEdit={openEdit} onDelete={() => setConfirmDelete({ table: "directors", id: item.id, name: item.profile_id })}>
                <td className="p-3 text-sm" style={{ color: "var(--text-primary)" }}>
                  {profiles.find((p) => p.id === item.profile_id)?.full_name || "-"}
                </td>
                <td className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {accounts.find((a) => a.id === item.account_id)?.name || "-"}
                </td>
                <td className="p-3 text-sm">{item.is_active ? "✓" : "✗"}</td>
              </Row>
            ))}
            {tab === "assignments" && assignments.map((asgn) => (
              <Row key={asgn.team_id} item={asgn} onEdit={() => setEditing(asgn)} onDelete={() => {}}>
                <td className="p-3 text-sm" style={{ color: "var(--text-primary)" }}>{asgn.team_name}</td>
                <td className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {asgn.account_ids.length === 0
                    ? "Sin cuentas"
                    : accounts.filter((a) => asgn.account_ids.includes(a.id)).map((a) => a.name).join(", ")}
                </td>
                <td className="p-3 text-sm">
                  <button onClick={() => setEditing(asgn)}
                    className="px-3 py-1 rounded text-xs font-medium text-white"
                    style={{ background: "var(--accent-cyan)" }}>
                    Editar
                  </button>
                </td>
              </Row>
            ))}
            {(() => {
              const colSpan = tab === "areas" ? 4 : tab === "agencies" ? 4 : tab === "accounts" ? 5 : tab === "teams" ? 5 : tab === "assignments" ? 3 : 4;
              return currentData.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="p-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    Sin registros
                  </td>
                </tr>
              ) : null;
            })()}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--divider)" }}>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {currentData.length} registros · Página {currentPage + 1} de {totalPages}
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

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? `Editar ${tab}` : `Nuevo ${tab}`}>
        <CatalogForm
          tab={tab}
          editing={editing}
          agencies={agencies}
          accounts={accounts}
          teams={teams}
          profiles={profiles}
          onDone={() => { setShowModal(false); setEditing(null); fetchData(); }}
        />
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirmar eliminación">
        <div className="flex flex-col gap-4">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            ¿Eliminar <strong style={{ color: "var(--text-primary)" }}>{confirmDelete?.name}</strong>?
          </p>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setConfirmDelete(null)}
              className="px-4 py-2 rounded-lg text-sm" style={{ color: "var(--text-muted)" }}>
              Cancelar
            </button>
            <button onClick={() => confirmDelete && handleDelete(confirmDelete.table, confirmDelete.id)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--accent-rose)" }}>
              Eliminar
            </button>
          </div>
        </div>
      </Modal>

      {/* Assignment Modal */}
      <Modal isOpen={showAssignmentModal} onClose={() => setShowAssignmentModal(false)} title={editing ? `Editar Asignación: ${(editing as TeamAssignment).team_name}` : "Nueva Asignación Equipo → Cuentas"}>
        <AssignmentForm
          editing={editing as TeamAssignment | null}
          teams={teams}
          accounts={accounts}
          onDone={() => { setShowAssignmentModal(false); setEditing(null); fetchData(); }}
        />
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} title={`Carga masiva ${tabs.find((t) => t.key === tab)?.label || ""} (CSV)`}>
        <BulkCatalogForm tab={tab} agencies={agencies} accounts={accounts} profiles={profiles} />
      </Modal>
    </div>
  );
}

function Headers({ cols }: { cols: string[] }) {
  return cols.map((c) => (
    <th key={c} className="p-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
      {c}
    </th>
  ));
}

const TEMPLATES: Record<string, { headers: string[]; example: string[] }> = {
  areas: { headers: ["name", "code", "active"], example: ["Área Creativa", "CREA", "1"] },
  agencies: { headers: ["name", "code", "active"], example: ["Agencia Central", "AGC", "1"] },
  accounts: { headers: ["name", "agency", "code", "active"], example: ["Cuenta Coca-Cola", "Agencia Central", "CCL", "1"] },
  teams: { headers: ["name", "code", "director", "active"], example: ["Equipo Digital", "EQD", "Maria Directora", "1"] },
  directors: { headers: ["profile", "account", "active"], example: ["Maria Directora", "Cuenta Coca-Cola", "1"] },
};

function getTableNameForBulk(t: string): string {
  if (t === "areas") return "areas";
  if (t === "agencies") return "agencies";
  if (t === "accounts") return "accounts";
  if (t === "teams") return "teams";
  return "directors";
}

function BulkCatalogForm({ tab, agencies, accounts, profiles }: {
  tab: string; agencies: Agency[]; accounts: Account[]; profiles: { id: string; full_name: string }[];
}) {
  const supabase = createClient();
  const [csvText, setCsvText] = useState("");
  const [parsed, setParsed] = useState<CsvRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ created: number; errors: { row: number; error: string }[] } | null>(null);

  const findByName = <T extends { name: string; code?: string }>(list: T[], value: string) =>
    list.find((x) => x.name.toLowerCase() === value.toLowerCase() || (x.code && x.code.toLowerCase() === value.toLowerCase()));

  const findProfile = (value: string) =>
    profiles.find((x) => x.full_name.toLowerCase() === value.toLowerCase());

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

  const buildRows = (): { table: string; rows: Record<string, unknown>[]; errors: { row: number; error: string }[] } => {
    const errors: { row: number; error: string }[] = [];
    const rows: Record<string, unknown>[] = [];

    parsed.forEach((row, idx) => {
      const rowNumber = idx + 2;
      const name = (row.name || "").trim();
      const code = (row.code || "").trim();
      const active = csvToBool(row.active ?? "", true);
      if (!name) { errors.push({ row: rowNumber, error: "Falta el nombre" }); return; }

      if (tab === "areas") {
        rows.push({ name, code, is_active: active });
      } else if (tab === "agencies") {
        rows.push({ name, code, is_active: active });
      } else if (tab === "accounts") {
        const agency = findByName(agencies, (row.agency || "").trim());
        if (!agency) { errors.push({ row: rowNumber, error: `Agencia "${row.agency || ""}" no encontrada` }); return; }
        rows.push({ name, agency_id: agency.id, code, is_active: active });
      } else if (tab === "teams") {
        const account = findByName(accounts, (row.account || "").trim());
        if (!account) { errors.push({ row: rowNumber, error: `Cuenta "${row.account || ""}" no encontrada` }); return; }
        const directorRef = (row.director || "").trim();
        const director = directorRef ? findProfile(directorRef) : undefined;
        if (directorRef && !director) { errors.push({ row: rowNumber, error: `Director "${directorRef}" no encontrado` }); return; }
        rows.push({ name, account_id: account.id, code, director_id: director?.id || null, is_active: active });
      } else if (tab === "directors") {
        const profile = findProfile((row.profile || "").trim());
        if (!profile) { errors.push({ row: rowNumber, error: `Perfil "${row.profile || ""}" no encontrado` }); return; }
        const accountRef = (row.account || "").trim();
        const account = accountRef ? findByName(accounts, accountRef) : undefined;
        if (accountRef && !account) { errors.push({ row: rowNumber, error: `Cuenta "${accountRef}" no encontrada` }); return; }
        rows.push({ profile_id: profile.id, account_id: account?.id || null, is_active: active });
      }
    });

    return { table: getTableNameForBulk(tab), rows, errors };
  };

  const handleSubmit = async () => {
    if (parsed.length === 0) return;
    setSaving(true);
    setResult(null);

    const { table, rows, errors } = buildRows();
    if (errors.length > 0 || rows.length === 0) {
      setSaving(false);
      setResult({ created: 0, errors });
      return;
    }

    let created = 0;
    const finalErrors = [...errors];

    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error } = await supabase.from(table).insert(chunk);
      if (error) {
        finalErrors.push({ row: i + 2, error: error.message });
      } else {
        created += chunk.length;
      }
    }

    setSaving(false);
    setResult({ created, errors: finalErrors });
  };

  const template = TEMPLATES[tab];

  return (
    <div className="flex flex-col gap-4">
      <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
        Columnas esperadas: <code className="px-1 rounded" style={{ background: "var(--accordion-bg)" }}>{template.headers.join(", ")}</code>.
        Las referencias (agencia, cuenta, director, perfil) se resuelven por nombre o código. La columna <code className="px-1 rounded" style={{ background: "var(--accordion-bg)" }}>active</code> acepta 1/0, true/false, sí/no.
      </div>

      <button
        onClick={() => downloadCSV(`plantilla_${tab}.csv`, `${template.headers.join(",")}\n${template.example.join(",")}`)}
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
          <div style={{ color: "var(--accent-green)" }}>{result.created} registros creados</div>
          {result.errors.length > 0 && (
            <>
              <div style={{ color: "var(--accent-rose)" }}>{result.errors.length} errores:</div>
              {result.errors.map((err, i) => (
                <div key={i} style={{ color: "var(--accent-rose)" }}>Fila {err.row}: {err.error}</div>
              ))}
            </>
          )}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <button onClick={handleSubmit} disabled={saving || parsed.length === 0}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--accent-cyan)" }}>
          {saving ? "Creando registros..." : "Crear registros"}
        </button>
      </div>
    </div>
  );
}

function Row({ item, onEdit, onDelete, children }: { item: unknown; onEdit: (item: unknown) => void; onDelete: () => void; children: React.ReactNode }) {
  return (
    <tr style={{ borderTop: "1px solid var(--divider)" }}>
      {children}
      <td className="p-3 text-right">
        <button onClick={() => onEdit(item)} className="p-1.5 rounded hover:opacity-70 inline-flex" style={{ color: "var(--accent-cyan)" }} title="Editar">
          <Edit2 size={14} />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded hover:opacity-70 inline-flex" style={{ color: "var(--accent-rose)" }} title="Eliminar">
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}

function CatalogForm({ tab, editing, agencies, accounts, teams, profiles, onDone }: {
  tab: string; editing: unknown; agencies: Agency[]; accounts: Account[]; teams: Team[]; profiles: { id: string; full_name: string }[]; onDone: () => void;
}) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const editData = (editing && typeof editing === "object" ? editing : null) as Record<string, unknown> | null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const form = e.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form));
    const editId = editing && typeof editing === "object" && "id" in editing ? (editing as { id: string }).id : null;

    if (tab === "areas") {
      if (editId) await supabase.from("areas").update({ name: data.name, code: data.code, is_active: data.is_active === "on" }).eq("id", editId);
      else await supabase.from("areas").insert({ name: data.name, code: data.code });
    } else if (tab === "agencies") {
      if (editId) await supabase.from("agencies").update({ name: data.name, code: data.code, is_active: data.is_active === "on" }).eq("id", editId);
      else await supabase.from("agencies").insert({ name: data.name, code: data.code });
    } else if (tab === "accounts") {
      if (editId) await supabase.from("accounts").update({ name: data.name, agency_id: data.agency_id, code: data.code, is_active: data.is_active === "on" }).eq("id", editId);
      else await supabase.from("accounts").insert({ name: data.name, agency_id: data.agency_id, code: data.code });
    } else if (tab === "teams") {
      if (editId) await supabase.from("teams").update({ name: data.name, code: data.code, director_id: data.director_id || null, is_active: data.is_active === "on" }).eq("id", editId);
      else await supabase.from("teams").insert({ name: data.name, code: data.code, director_id: data.director_id || null });
    } else if (tab === "directors") {
      if (editId) await supabase.from("directors").update({ profile_id: data.profile_id, account_id: data.account_id || null, is_active: data.is_active === "on" }).eq("id", editId);
      else await supabase.from("directors").insert({ profile_id: data.profile_id, account_id: data.account_id || null });
    }
    setSaving(false);
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {tab !== "directors" && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Nombre</label>
          <input name="name" defaultValue={String(editData?.name || "")} required
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
        </div>
      )}

      {tab === "accounts" && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Agencia</label>
          <select name="agency_id" defaultValue={String(editData?.agency_id || "")} required
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
            <option value="">Seleccionar...</option>
            {agencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      )}

      {tab === "teams" && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Director</label>
            <select name="director_id" defaultValue={String(editData?.director_id || "")}
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
              <option value="">Sin director</option>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
        </>
      )}

      {tab === "directors" && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Perfil</label>
            <select name="profile_id" defaultValue={String(editData?.profile_id || "")} required
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
              <option value="">Seleccionar...</option>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Cuenta / Marca</label>
            <select name="account_id" defaultValue={String(editData?.account_id || "")}
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
              <option value="">Sin cuenta</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </>
      )}

      {tab !== "directors" && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Código</label>
          <input name="code" defaultValue={String(editData?.code || "")}
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
        </div>
      )}

      {editData && (
        <div className="flex items-center gap-2">
          <input name="is_active" type="checkbox" defaultChecked={editData?.is_active !== false} id="is_active" className="rounded" />
          <label htmlFor="is_active" className="text-xs" style={{ color: "var(--text-secondary)" }}>Activo</label>
        </div>
      )}

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

function AssignmentForm({ editing, teams, accounts, onDone }: {
  editing: TeamAssignment | null;
  teams: Team[];
  accounts: Account[];
  onDone: () => void;
}) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

  useEffect(() => {
    if (editing) {
      setSelectedTeamId(editing.team_id);
      setSelectedAccountIds(editing.account_ids || []);
    } else {
      setSelectedTeamId("");
      setSelectedAccountIds([]);
    }
  }, [editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) return;
    setSaving(true);

    const existing = await supabase.from("team_accounts").select("account_id").eq("team_id", selectedTeamId);
    const existingAccountIds = (existing.data || []).map((r) => r.account_id);

    const toRemove = existingAccountIds.filter((id) => !selectedAccountIds.includes(id));
    const toAdd = selectedAccountIds.filter((id) => !existingAccountIds.includes(id));

    if (toRemove.length > 0) {
      await supabase.from("team_accounts").delete().eq("team_id", selectedTeamId).in("account_id", toRemove);
    }

    if (toAdd.length > 0) {
      const rows = toAdd.map((account_id) => ({ team_id: selectedTeamId, account_id }));
      await supabase.from("team_accounts").insert(rows);
    }

    setSaving(false);
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Equipo</label>
        <select value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
          <option value="">Seleccionar equipo...</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Cuentas asignadas</label>
        <div className="flex flex-wrap gap-2" style={{ maxHeight: 200, overflow: "auto" }}>
          {accounts.map((a) => (
            <label key={a.id} className="flex items-center gap-2 px-3 py-2 rounded border cursor-pointer"
              style={{ background: "var(--input-bg)", borderColor: "var(--input-border)", color: "var(--text-primary)" }}>
              <input type="checkbox" value={a.id} checked={selectedAccountIds.includes(a.id)}
                onChange={(e) => setSelectedAccountIds((prev) =>
                  e.target.checked ? [...prev, a.id] : prev.filter((id) => id !== a.id)
                )}
                className="rounded" />
              <span className="text-sm">{a.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button type="submit" disabled={saving || !selectedTeamId}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--accent-cyan)" }}>
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}
