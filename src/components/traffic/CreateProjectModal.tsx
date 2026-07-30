"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { X, FolderKanban } from "lucide-react";

interface Account { id: string; name: string; agency_id: string }
interface Agency { id: string; name: string }

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateProjectModal({ open, onClose, onCreated }: CreateProjectModalProps) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAgency, setSelectedAgency] = useState("");

  useEffect(() => {
    if (!open) return;
    setName("");
    setAccountId("");
    setError("");
    setSelectedAgency("");
    supabase.from("agencies").select("id, name").then(({ data }) => {
      if (data) setAgencies(data);
    });
    supabase.from("accounts").select("id, name, agency_id").then(({ data }) => {
      if (data) setAccounts(data);
    });
  }, [open, supabase]);

  const filteredAccounts = selectedAgency
    ? accounts.filter((a) => a.agency_id === selectedAgency)
    : accounts;

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !accountId) {
      setError("Nombre y cuenta son requeridos");
      return;
    }
    setSaving(true);
    setError("");

    const { error: insertErr } = await supabase.from("projects").insert({
      name: name.trim(),
      account_id: accountId,
      status: "ACTIVE",
    });

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
        className="w-full max-w-md rounded-2xl animate-slideUp"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <FolderKanban size={18} style={{ color: "var(--accent-cyan)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Nuevo Proyecto</h2>
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
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Agencia</label>
            <select
              value={selectedAgency}
              onChange={(e) => { setSelectedAgency(e.target.value); setAccountId(""); }}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
            >
              <option value="">Todas las agencias</option>
              {agencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Cuenta *</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
              required
            >
              <option value="">Seleccionar cuenta...</option>
              {filteredAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Nombre del Proyecto *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Campaña Q1 2026"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
              autoFocus
              required
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
              disabled={saving || !name.trim() || !accountId}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: "var(--accent-cyan)" }}
            >
              {saving ? "Creando..." : "Crear Proyecto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
