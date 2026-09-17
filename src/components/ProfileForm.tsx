"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { User, Save } from "lucide-react";
import { roleLabel } from "@/lib/utils";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  role: string;
  position: string;
  position_description: string;
  capacity: number;
}

export function ProfileForm() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data, error: authErr }) => {
      if (cancelled) return;
      if (!data.user || authErr) {
        setProfile(null);
        setError("No se pudo autenticar. Inicia sesión de nuevo.");
        return;
      }
      setUserEmail(data.user.email || "");
      supabase.from("profiles").select("*").eq("id", data.user.id).single().then(({ data: p, error: profErr }) => {
        if (cancelled) return;
        if (profErr || !p) {
          setProfile(null);
          setError(`Perfil no encontrado para ${data.user.email}. Ejecuta fix_jose_complete.sql en Supabase SQL Editor.`);
          return;
        }
        setProfile(p);
      });
    }).catch(() => {
      if (!cancelled) {
        setProfile(null);
        setError("Error de conexión con Supabase.");
      }
    });
    return () => { cancelled = true; };
  }, [supabase]);

  const [saveError, setSaveError] = useState<string>("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!profile.full_name?.trim()) {
      setSaveError("El nombre es obligatorio");
      return;
    }
    if (profile.capacity < 0 || profile.capacity > 100) {
      setSaveError("La capacidad debe ser entre 0 y 100");
      return;
    }
    setSaving(true);
    setSaveError("");
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name.trim(),
      position: profile.position,
      position_description: profile.position_description,
      capacity: profile.capacity,
    }).eq("id", profile.id);
    if (error) {
      setSaveError("Error al guardar. Intenta de nuevo.");
    }
    setSaving(false);
  };

  if (error) {
    return (
      <div className="animate-fadeIn max-w-2xl">
        <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Perfil</h1>
        <div className="rounded-xl p-6" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
          <p className="text-sm mb-4" style={{ color: "var(--accent-rose)" }}>{error}</p>
          <button onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{ background: "var(--accent-cyan)", color: "var(--primary-fg)" }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: "var(--accent-cyan)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn max-w-2xl">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Perfil</h1>

      <GlassCard className="p-6">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {saveError && (
            <div className="px-3 py-2 rounded-lg text-xs flex items-center justify-between" style={{ background: "rgba(235, 62, 64, 0.1)", color: "var(--accent-rose)" }}>
              <span>{saveError}</span>
              <button type="button" onClick={() => setSaveError("")} className="font-semibold hover:opacity-70">✕</button>
            </div>
          )}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{ background: "rgba(235, 62, 64, 0.15)", color: "var(--accent-cyan)", border: "2px solid var(--accent-cyan)" }}>
              {profile.full_name?.charAt(0) || "?"}
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{profile.full_name}</h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{profile.email}</p>
              <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{
                background: profile.role === "SUPERADMIN" ? "rgba(235, 62, 64, 0.15)" :
                  profile.role === "SYSADMIN" ? "rgba(143,163,255,0.15)" :
                  profile.role === "DIRECTOR" || profile.role === "GERENTE" ? "rgba(255,209,102,0.15)" :
                  "rgba(125,216,125,0.15)",
                color: profile.role === "SUPERADMIN" ? "var(--accent-rose)" :
                  profile.role === "SYSADMIN" ? "var(--accent-purple)" :
                  profile.role === "DIRECTOR" || profile.role === "GERENTE" ? "var(--accent-amber)" :
                  "var(--accent-green)",
              }}>
                {roleLabel(profile.role)}
              </span>
            </div>
          </div>

          <Field label="Nombre Completo">
            <input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
          </Field>

          <Field label="Posición">
            <input value={profile.position} onChange={(e) => setProfile({ ...profile, position: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
          </Field>

          <Field label="Descripción">
            <textarea value={profile.position_description} onChange={(e) => setProfile({ ...profile, position_description: e.target.value })}
              rows={3} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
          </Field>

          <Field label="Capacidad (%)">
            <input type="number" min={0} max={100} value={profile.capacity} onChange={(e) => setProfile({ ...profile, capacity: Math.min(100, Math.max(0, Number(e.target.value))) })}
              className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
          </Field>

          <button type="submit" disabled={saving}
            className="flex items-center justify-center gap-2 self-start rounded-lg px-6 py-2 text-sm font-medium disabled:opacity-50"
            style={{ background: "var(--accent-cyan)", color: "var(--primary-fg)" }}>
            <Save size={16} /> {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </form>
      </GlassCard>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{label}</label>
      {children}
    </div>
  );
}
