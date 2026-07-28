"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Modal } from "@/components/ui/Modal";
import { Plus, Edit2, Trash2 } from "lucide-react";

type Tab = "agencies" | "accounts" | "teams" | "directors";

interface Agency { id: string; name: string; code: string; is_active: boolean }
interface Account { id: string; name: string; agency_id: string; code: string; is_active: boolean }
interface Team { id: string; name: string; account_id: string; code: string; is_active: boolean; director_id: string | null }
interface Director { id: string; profile_id: string; team_id: string | null; is_active: boolean }

export default function CatalogosPage() {
  const [tab, setTab] = useState<Tab>("agencies");
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [directors, setDirectors] = useState<Director[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; full_name: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Record<string, string> | null>(null);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const [a, ac, t, d, p] = await Promise.all([
      supabase.from("agencies").select("*").order("name"),
      supabase.from("accounts").select("*").order("name"),
      supabase.from("teams").select("*").order("name"),
      supabase.from("directors").select("*"),
      supabase.from("profiles").select("id, full_name").order("full_name"),
    ]);
    if (a.data) setAgencies(a.data);
    if (ac.data) setAccounts(ac.data);
    if (t.data) setTeams(t.data);
    if (d.data) setDirectors(d.data);
    if (p.data) setProfiles(p.data);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "agencies", label: "Agencias" },
    { key: "accounts", label: "Cuentas" },
    { key: "teams", label: "Equipos" },
    { key: "directors", label: "Directores" },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Catálogos</h1>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--accent-cyan)", color: "#fff" }}
        >
          <Plus size={16} /> Nuevo
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

      <GlassCard className="overflow-hidden">
        {tab === "agencies" && (
          <CatalogTable
            data={agencies}
            columns={["Nombre", "Código", "Activo"]}
            renderRow={(a: Agency) => (
              <>
                <td className="p-3 text-sm" style={{ color: "var(--text-primary)" }}>{a.name}</td>
                <td className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>{a.code}</td>
                <td className="p-3 text-sm">{a.is_active ? "✓" : "✗"}</td>
              </>
            )}
          />
        )}
        {tab === "accounts" && (
          <CatalogTable
            data={accounts}
            columns={["Nombre", "Agencia", "Código", "Activo"]}
            renderRow={(a: Account) => (
              <>
                <td className="p-3 text-sm" style={{ color: "var(--text-primary)" }}>{a.name}</td>
                <td className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {agencies.find((ag) => ag.id === a.agency_id)?.name || "-"}
                </td>
                <td className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>{a.code}</td>
                <td className="p-3 text-sm">{a.is_active ? "✓" : "✗"}</td>
              </>
            )}
          />
        )}
        {tab === "teams" && (
          <CatalogTable
            data={teams}
            columns={["Nombre", "Cuenta", "Código", "Director", "Activo"]}
            renderRow={(t: Team) => (
              <>
                <td className="p-3 text-sm" style={{ color: "var(--text-primary)" }}>{t.name}</td>
                <td className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {accounts.find((a) => a.id === t.account_id)?.name || "-"}
                </td>
                <td className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>{t.code}</td>
                <td className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {profiles.find((p) => p.id === t.director_id)?.full_name || "-"}
                </td>
                <td className="p-3 text-sm">{t.is_active ? "✓" : "✗"}</td>
              </>
            )}
          />
        )}
        {tab === "directors" && (
          <CatalogTable
            data={directors}
            columns={["Perfil", "Equipo", "Activo"]}
            renderRow={(d: Director) => (
              <>
                <td className="p-3 text-sm" style={{ color: "var(--text-primary)" }}>
                  {profiles.find((p) => p.id === d.profile_id)?.full_name || "-"}
                </td>
                <td className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {teams.find((t) => t.id === d.team_id)?.name || "-"}
                </td>
                <td className="p-3 text-sm">{d.is_active ? "✓" : "✗"}</td>
              </>
            )}
          />
        )}
      </GlassCard>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`Nuevo ${tab}`}>
        <CatalogForm tab={tab} agencies={agencies} accounts={accounts} profiles={profiles} onDone={() => { setShowModal(false); fetchData(); }} />
      </Modal>
    </div>
  );
}

function CatalogTable<T>({ data, columns, renderRow }: { data: T[]; columns: string[]; renderRow: (item: T) => React.ReactNode }) {
  return (
    <table className="w-full">
      <thead>
        <tr style={{ background: "var(--table-header)" }}>
          {columns.map((c) => (
            <th key={c} className="p-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, i) => (
          <tr key={i} style={{ borderTop: "1px solid var(--divider)" }}>
            {renderRow(item)}
          </tr>
        ))}
        {data.length === 0 && (
          <tr>
            <td colSpan={columns.length} className="p-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              Sin registros
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function CatalogForm({ tab, agencies, accounts, profiles, onDone }: { tab: string; agencies: Agency[]; accounts: Account[]; profiles: { id: string; full_name: string }[]; onDone: () => void }) {
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form));

    if (tab === "agencies") {
      await supabase.from("agencies").insert({ name: data.name, code: data.code });
    } else if (tab === "accounts") {
      await supabase.from("accounts").insert({ name: data.name, agency_id: data.agency_id, code: data.code });
    } else if (tab === "teams") {
      await supabase.from("teams").insert({ name: data.name, account_id: data.account_id, code: data.code, director_id: data.director_id || null });
    } else if (tab === "directors") {
      await supabase.from("directors").insert({ profile_id: data.profile_id, team_id: data.team_id || null });
    }
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input name="name" label="Nombre" required={tab !== "directors"} />
      {tab === "accounts" && (
        <Select name="agency_id" label="Agencia" required options={agencies.map((a) => ({ value: a.id, label: a.name }))} />
      )}
      {tab === "teams" && (
        <>
          <Select name="account_id" label="Cuenta" required options={accounts.map((a) => ({ value: a.id, label: a.name }))} />
          <Select name="director_id" label="Director" options={profiles.map((p) => ({ value: p.id, label: p.full_name }))} />
        </>
      )}
      {tab === "directors" && (
        <>
          <Select name="profile_id" label="Perfil" required options={profiles.map((p) => ({ value: p.id, label: p.full_name }))} />
          <Select name="team_id" label="Equipo" options={[{ value: "", label: "Sin equipo" }, ...accounts.map((a) => ({ value: a.id, label: a.name }))]} />
        </>
      )}
      {tab !== "directors" && <Input name="code" label="Código" />}
      <button
        type="submit"
        className="rounded-lg px-4 py-2 text-sm font-medium"
        style={{ background: "var(--accent-cyan)", color: "#fff" }}
      >
        Guardar
      </button>
    </form>
  );
}

function Input({ name, label, required }: { name: string; label: string; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{label}</label>
      <input
        name={name}
        required={required}
        className="rounded-lg px-3 py-2 text-sm"
        style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
      />
    </div>
  );
}

function Select({ name, label, required, options }: { name: string; label: string; required?: boolean; options: { value: string; label: string }[] }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{label}</label>
      <select
        name={name}
        required={required}
        className="rounded-lg px-3 py-2 text-sm"
        style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
      >
        <option value="">Seleccionar...</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
