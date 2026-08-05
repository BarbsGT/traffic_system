"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, Mail, ArrowLeft, CheckCircle } from "lucide-react";

const LOGIN_COOLDOWN_MS = 2000;

async function homePathFor(userId: string): Promise<string> {
  if (!userId) return "/login";
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  const role = data?.role;
  if (role === "SUPERADMIN" || role === "SYSADMIN") return "/dashboard";
  return "/projects";
}

function safeNext(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  if (raw.startsWith("/login")) return null;
  return raw;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  const [view, setView] = useState<"login" | "forgot" | "sent">("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const lastLoginRef = useRef(0);
  const lastForgotRef = useRef(0);
  const [loginCooldown, setLoginCooldown] = useState(false);
  const [forgotCooldown, setForgotCooldown] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const next = safeNext(new URLSearchParams(window.location.search).get("next"));
        if (next) router.push(next);
        else router.push(await homePathFor(data.user.id));
      } else setChecking(false);
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastLoginRef.current < LOGIN_COOLDOWN_MS) return;
    lastLoginRef.current = now;
    if (!email.trim() || !password) {
      setError("Ingresa tu correo y contraseña");
      return;
    }
    setLoading(true);
    setLoginCooldown(true);
    setError("");
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (authError) {
      setError(
        authError.message.includes("Invalid login")
          ? "Correo o contraseña incorrectos"
          : authError.message
      );
      setLoading(false);
      setTimeout(() => setLoginCooldown(false), LOGIN_COOLDOWN_MS);
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const next = safeNext(new URLSearchParams(window.location.search).get("next"));
    if (next) router.push(next);
    else router.push(await homePathFor(userData.user?.id || ""));
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastForgotRef.current < LOGIN_COOLDOWN_MS) return;
    lastForgotRef.current = now;
    if (!forgotEmail.trim()) {
      setForgotError("Ingresa tu correo");
      return;
    }
    setForgotLoading(true);
    setForgotCooldown(true);
    setForgotError("");
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${location.origin}/auth/reset-password`,
    });
    if (resetError) {
      setForgotError(resetError.message);
      setForgotLoading(false);
      setTimeout(() => setForgotCooldown(false), LOGIN_COOLDOWN_MS);
      return;
    }
    setForgotLoading(false);
    setView("sent");
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
          Visibilidad 360°
        </p>

        {/* ===== LOGIN VIEW ===== */}
        {view === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="px-3 py-2 rounded-lg text-xs text-left" style={{ background: "rgba(244,63,94,0.1)", color: "var(--accent-rose)" }}>
                {error}
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-cyan)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--input-border)"; }}
                autoFocus
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg px-3 py-2.5 pr-10 text-sm outline-none transition-all"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-cyan)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--input-border)"; }}
                  autoComplete="current-password"
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

            <div className="text-right">
              <button
                type="button"
                onClick={() => { setView("forgot"); setForgotEmail(email); setForgotError(""); }}
                className="text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: "var(--accent-cyan)" }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || loginCooldown || !email.trim() || !password}
              className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all disabled:opacity-50 active:scale-[0.98]"
              style={{ background: "var(--accent-cyan)" }}
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <LogIn size={18} />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>
        )}

        {/* ===== FORGOT PASSWORD VIEW ===== */}
        {view === "forgot" && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <button
              type="button"
              onClick={() => setView("login")}
              className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70 mx-auto"
              style={{ color: "var(--text-muted)" }}
            >
              <ArrowLeft size={14} />
              Volver al login
            </button>

            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            {forgotError && (
              <div className="px-3 py-2 rounded-lg text-xs text-left" style={{ background: "rgba(244,63,94,0.1)", color: "var(--accent-rose)" }}>
                {forgotError}
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Correo electrónico</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-cyan)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--input-border)"; }}
                autoFocus
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={forgotLoading || forgotCooldown || !forgotEmail.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all disabled:opacity-50 active:scale-[0.98]"
              style={{ background: "var(--accent-cyan)" }}
            >
              {forgotLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Mail size={18} />
                  Enviar Enlace
                </>
              )}
            </button>
          </form>
        )}

        {/* ===== SENT VIEW ===== */}
        {view === "sent" && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.15)" }}>
                <CheckCircle size={28} style={{ color: "var(--accent-green)" }} />
              </div>
            </div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Revisa tu correo</h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Enviamos un enlace de restablecimiento a
            </p>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{forgotEmail}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              ¿No lo recibiste? Revisa tu carpeta de spam o intenta de nuevo.
            </p>
            <button
              type="button"
              onClick={() => { setView("login"); setEmail(forgotEmail); setPassword(""); }}
              className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all"
              style={{ background: "var(--accordion-bg)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
            >
              <ArrowLeft size={16} />
              Volver al Login
            </button>
          </div>
        )}

        <p className="text-[11px] mt-6" style={{ color: "var(--text-muted)" }}>
          AgencyGrid — Grupo Lo Bueno
        </p>
      </div>
    </div>
  );
}
