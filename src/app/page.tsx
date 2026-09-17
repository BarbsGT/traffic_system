"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, FolderKanban, CheckSquare, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--background)" }}>
<header className="flex items-center justify-between px-8 py-4">
        <img src="/ogilvy-logo.png" alt="Ogilvy" style={{ height: 34, width: "auto" }} />
        <div className="flex gap-4">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium transition-all"
            style={{ color: "var(--text-primary)", background: "var(--glass-bg)" }}
          >
            Iniciar Sesión
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="glass p-12 max-w-2xl animate-fadeIn">
          <h1 className="mb-8 flex items-center justify-center">
            <img src="/ogilvy-logo.png" alt="Ogilvy" style={{ height: 64, width: "auto" }} />
          </h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { icon: <BarChart3 size={24} />, label: "Dashboard" },
              { icon: <FolderKanban size={24} />, label: "Proyectos" },
              { icon: <CheckSquare size={24} />, label: "Tareas" },
              { icon: <Shield size={24} />, label: "RBAC" },
            ].map((f) => (
              <div
                key={f.label}
                className="flex flex-col items-center gap-2 rounded-lg p-4"
                style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
              >
                <span style={{ color: "var(--accent-cyan)" }}>{f.icon}</span>
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{f.label}</span>
              </div>
            ))}
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-all"
            style={{ background: "var(--accent-cyan)", color: "var(--primary-fg)" }}
          >
            Comenzar <ArrowRight size={16} />
          </Link>
        </div>
      </main>

      <footer className="py-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
        <img src="/ogilvy-logo.png" alt="Ogilvy" style={{ height: 24, width: "auto" }} className="mx-auto" />
      </footer>
    </div>
  );
}
