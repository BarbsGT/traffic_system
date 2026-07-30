"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidSession(true);
      } else {
        setError("Enlace inválido o expirado. Solicita uno nuevo.");
      }
      setChecking(false);
    });
  }, [supabase]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Ingresa tu nueva contraseña");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    setError("");
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    setSuccess(true);
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid" style={{ borderColor: "var(--accent-cyan)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg-primary)" }}>
      <div className="glass p-10 w-full max-w-sm animate-fadeIn text-center">
        <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          AgencyGrid
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--accent-cyan)" }}>
          Restablecer Contraseña
        </p>

        {/* Success */}
        {success ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.15)" }}>
                <CheckCircle size={28} style={{ color: "var(--accent-green)" }} />
              </div>
            </div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>¡Contraseña actualizada!</h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all active:scale-[0.98]"
              style={{ background: "var(--accent-cyan)" }}
            >
              Iniciar Sesión
            </button>
          </div>
        ) : !validSession ? (
          /* Invalid link */
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--accent-rose)" }}>{error}</p>
            <button
              onClick={() => router.push("/login")}
              className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all"
              style={{ background: "var(--accordion-bg)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
            >
              <ArrowLeft size={16} />
              Volver al Login
            </button>
          </div>
        ) : (
          /* Reset form */
          <form onSubmit={handleReset} className="space-y-4">
            {error && (
              <div className="px-3 py-2 rounded-lg text-xs text-left" style={{ background: "rgba(244,63,94,0.1)", color: "var(--accent-rose)" }}>
                {error}
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-lg px-3 py-2.5 pr-10 text-sm outline-none transition-all"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-cyan)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--input-border)"; }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Confirmar contraseña</label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-cyan)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--input-border)"; }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all disabled:opacity-50 active:scale-[0.98]"
              style={{ background: "var(--accent-cyan)" }}
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                "Guardar Contraseña"
              )}
            </button>
          </form>
        )}

        <p className="text-[11px] mt-6" style={{ color: "var(--text-muted)" }}>
          AgencyGrid — Grupo Lo Bueno
        </p>
      </div>
    </div>
  );
}
