"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { User, Save } from "lucide-react";

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
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase.from("profiles").select("*").eq("id", data.user.id).single().then(({ data: p }) => {
        if (p) setProfile(p);
      });
    });
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    await supabase.from("profiles").update({
      full_name: profile.full_name,
      position: profile.position,
      position_description: profile.position_description,
      capacity: profile.capacity,
    }).eq("id", profile.id);
    setSaving(false);
  };

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
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{ background: "rgba(14,165,233,0.15)", color: "var(--accent-cyan)" }}>
              {profile.full_name?.charAt(0) || "?"}
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{profile.full_name}</h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{profile.email}</p>
              <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{
                background: profile.role === "SUPERADMIN" ? "rgba(244,63,94,0.15)" :
                  profile.role === "SYSADMIN" ? "rgba(139,92,246,0.15)" :
                  profile.role === "DIRECTOR" ? "rgba(245,158,11,0.15)" :
                  "rgba(16,185,129,0.15)",
                color: profile.role === "SUPERADMIN" ? "var(--accent-rose)" :
                  profile.role === "SYSADMIN" ? "var(--accent-purple)" :
                  profile.role === "DIRECTOR" ? "var(--accent-amber)" :
                  "var(--accent-green)",
              }}>
                {profile.role}
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
            <input type="number" min={0} max={100} value={profile.capacity} onChange={(e) => setProfile({ ...profile, capacity: Number(e.target.value) })}
              className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }} />
          </Field>

          <button type="submit" disabled={saving}
            className="flex items-center justify-center gap-2 self-start rounded-lg px-6 py-2 text-sm font-medium disabled:opacity-50"
            style={{ background: "var(--accent-cyan)", color: "#fff" }}>
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
