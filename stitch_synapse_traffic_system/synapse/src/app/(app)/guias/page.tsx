"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { BookOpen, ArrowRight } from "lucide-react";
import { useState } from "react";

const sections = [
  { id: "intro", title: "Introducción" },
  { id: "proyectos", title: "Gestión de Proyectos" },
  { id: "tareas", title: "Gestión de Tareas" },
  { id: "equipo", title: "Gestión de Equipo" },
  { id: "roles", title: "Roles y Permisos" },
  { id: "alertas", title: "Alertas y Notificaciones" },
  { id: "faq", title: "Preguntas Frecuentes" },
];

export default function GuiasPage() {
  const [active, setActive] = useState("intro");

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
        Guías de Uso
      </h1>

      <div className="flex gap-6">
        <nav className="w-56 shrink-0">
          <div className="glass p-3 flex flex-col gap-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className="text-left px-3 py-2 rounded-lg text-sm transition-all"
                style={{
                  background: active === s.id ? "rgba(14, 165, 233, 0.15)" : "transparent",
                  color: active === s.id ? "var(--accent-cyan)" : "var(--text-secondary)",
                }}
              >
                {s.title}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-1">
          <GlassCard className="p-8">
            {active === "intro" && <IntroContent />}
            {active === "proyectos" && <ProyectosContent />}
            {active === "tareas" && <TareasContent />}
            {active === "equipo" && <EquipoContent />}
            {active === "roles" && <RolesContent />}
            {active === "alertas" && <AlertasContent />}
            {active === "faq" && <FAQContent />}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function IntroContent() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
        Bienvenido a Kairos
      </h2>
      <p className="mb-4" style={{ color: "var(--text-secondary)" }}>
        Kairos es el sistema de gestión de tráfico Synapse. Te permite administrar
        proyectos, tareas, equipos y recursos en un solo lugar.
      </p>
      <div className="glass p-6 mb-4">
        <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Flujo de Trabajo</h3>
        <div className="flex items-center gap-2 flex-wrap text-sm" style={{ color: "var(--text-secondary)" }}>
          <span className="px-3 py-1 rounded-full" style={{ background: "rgba(14,165,233,0.15)", color: "var(--accent-cyan)" }}>Agencia</span>
          <ArrowRight size={14} />
          <span className="px-3 py-1 rounded-full" style={{ background: "rgba(139,92,246,0.15)", color: "var(--accent-purple)" }}>Cuenta</span>
          <ArrowRight size={14} />
          <span className="px-3 py-1 rounded-full" style={{ background: "rgba(16,185,129,0.15)", color: "var(--accent-green)" }}>Equipo</span>
          <ArrowRight size={14} />
          <span className="px-3 py-1 rounded-full" style={{ background: "rgba(245,158,11,0.15)", color: "var(--accent-amber)" }}>Proyecto</span>
          <ArrowRight size={14} />
          <span className="px-3 py-1 rounded-full" style={{ background: "rgba(244,63,94,0.15)", color: "var(--accent-rose)" }}>Tarea</span>
        </div>
      </div>
    </div>
  );
}

function ProyectosContent() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Gestión de Proyectos</h2>
      <p style={{ color: "var(--text-secondary)" }}>Crea, edita y administra proyectos. Cada proyecto contiene tareas organizadas en un tablero Kanban.</p>
    </div>
  );
}

function TareasContent() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Gestión de Tareas</h2>
      <p style={{ color: "var(--text-secondary)" }}>Las tareas se asignan a colaboradores con estados: Pendiente, En Progreso, Revisión, Completado, Bloqueado.</p>
    </div>
  );
}

function EquipoContent() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Gestión de Equipo</h2>
      <p style={{ color: "var(--text-secondary)" }}>Administra colaboradores, sus roles, posiciones y asignaciones a cuentas y equipos.</p>
    </div>
  );
}

function RolesContent() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Roles y Permisos</h2>
      <div className="flex flex-col gap-3">
        {[
          { role: "SUPERADMIN", desc: "Acceso total al sistema" },
          { role: "SYSADMIN", desc: "Gestión completa de recursos" },
          { role: "DIRECTOR", desc: "Administra equipos y proyectos" },
          { role: "COLABORADOR", desc: "Tareas asignadas" },
        ].map((r) => (
          <div key={r.role} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "var(--card-bg)" }}>
            <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: "rgba(14,165,233,0.15)", color: "var(--accent-cyan)" }}>
              {r.role}
            </span>
            <span style={{ color: "var(--text-secondary)" }}>{r.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertasContent() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Alertas y Notificaciones</h2>
      <p style={{ color: "var(--text-secondary)" }}>Las alertas muestran tareas bloqueadas que requieren atención inmediata.</p>
    </div>
  );
}

function FAQContent() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Preguntas Frecuentes</h2>
      <div className="flex flex-col gap-4">
        {[
          { q: "¿Cómo creo un proyecto?", a: "Ve a Proyectos &gt; Nuevo Proyecto. Solo ADMIN puede crear proyectos." },
          { q: "¿Cómo asigno una tarea?", a: "Abre el proyecto, crea una tarea y asigna un colaborador." },
          { q: "¿Qué significa BLOCKED?", a: "Una tarea bloqueada necesita intervención para continuar." },
        ].map((faq, i) => (
          <div key={i} className="p-4 rounded-lg" style={{ background: "var(--card-bg)" }}>
            <p className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>{faq.q}</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
