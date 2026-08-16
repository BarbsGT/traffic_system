"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { BookOpen, ArrowRight } from "lucide-react";
import { useState } from "react";
import { roleLabel } from "@/lib/utils";

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
                  background: active === s.id ? "rgba(255, 180, 170, 0.12)" : "transparent",
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
        Bienvenido a AgencyGrid
      </h2>
      <p className="mb-4" style={{ color: "var(--text-secondary)" }}>
        AgencyGrid es una Web App para agencias de publicidad. Te permite administrar
        múltiples cuentas, marcas, equipos y proyectos con trazabilidad total.
      </p>
      <div className="glass p-6 mb-4">
        <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Flujo de Trabajo</h3>
        <div className="flex items-center gap-2 flex-wrap text-sm" style={{ color: "var(--text-secondary)" }}>
          <span className="px-3 py-1 rounded-full" style={{ background: "rgba(255,180,170,0.15)", color: "var(--accent-cyan)" }}>Agencia</span>
          <ArrowRight size={14} />
          <span className="px-3 py-1 rounded-full" style={{ background: "rgba(143,163,255,0.15)", color: "var(--accent-purple)" }}>Cuenta</span>
          <ArrowRight size={14} />
          <span className="px-3 py-1 rounded-full" style={{ background: "rgba(125,216,125,0.15)", color: "var(--accent-green)" }}>Equipo</span>
          <ArrowRight size={14} />
          <span className="px-3 py-1 rounded-full" style={{ background: "rgba(255,209,102,0.15)", color: "var(--accent-amber)" }}>Proyecto</span>
          <ArrowRight size={14} />
          <span className="px-3 py-1 rounded-full" style={{ background: "rgba(255,138,138,0.15)", color: "var(--accent-rose)" }}>Tarea</span>
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
  const roles = [
    {
      role: "SUPERADMIN",
      color: "var(--accent-rose)",
      bg: "rgba(255,138,138,0.15)",
      desc: "Acceso total al sistema. Puede crear, editar y eliminar proyectos, tareas, usuarios, directores de cuenta, cuentas, agencias y equipos.",
    },
    {
      role: "SYSADMIN",
      color: "var(--accent-purple)",
      bg: "rgba(143,163,255,0.15)",
      desc: "Gestión completa de recursos. Crea y edita proyectos, tareas, usuarios, cuentas y equipos. No puede eliminar registros críticos.",
    },
    {
      role: "DIRECTOR",
      color: "var(--accent-amber)",
      bg: "rgba(255,209,102,0.15)",
      desc: "Administra equipos y proyectos. Crea, edita proyectos y tareas. Asigna colaboradores a cuentas y equipos. Gestiona el día a día operativo.",
    },
    {
      role: "GERENTE",
      color: "var(--accent-cyan)",
      bg: "rgba(255,180,170,0.15)",
      desc: "Apoya al director dentro de sus cuentas asignadas. Crea y edita proyectos y tareas de sus cuentas y da seguimiento al equipo. No gestiona catálogos globales.",
    },
    {
      role: "COLABORADOR",
      color: "var(--accent-green)",
      bg: "rgba(125,216,125,0.15)",
      desc: "Usuario base. Visualiza proyectos y tareas. Puede actualizar el estado y descripción de sus tareas asignadas.",
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Roles y Permisos</h2>
      <div className="flex flex-col gap-4">
        {roles.map((r) => (
          <div key={r.role} className="p-4 rounded-lg" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: r.bg, color: r.color }}>
                {roleLabel(r.role)}
              </span>
            </div>
            <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>{r.desc}</p>
          </div>
        ))}
      </div>

      <h3 className="text-lg font-semibold mt-8 mb-3" style={{ color: "var(--text-primary)" }}>Matriz de Permisos</h3>
      <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid var(--card-border)" }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "var(--table-header)" }}>
              <th className="p-2 text-left font-semibold" style={{ color: "var(--text-muted)" }}>Recurso</th>
              <th className="p-2 text-center font-semibold" style={{ color: "var(--accent-rose)" }}>SUPER</th>
              <th className="p-2 text-center font-semibold" style={{ color: "var(--accent-purple)" }}>SYS</th>
              <th className="p-2 text-center font-semibold" style={{ color: "var(--accent-amber)" }}>DIR</th>
              <th className="p-2 text-center font-semibold" style={{ color: "var(--accent-green)" }}>COL</th>
            </tr>
          </thead>
          <tbody>
            {[
              { resource: "Proyectos (CRUD)", super: "✓", sys: "✓", dir: "✓", col: "—" },
              { resource: "Tareas (Crear)", super: "✓", sys: "✓", dir: "✓", col: "—" },
              { resource: "Tareas (Editar)", super: "✓", sys: "✓", dir: "✓", col: "Solo propias" },
              { resource: "Tareas (Eliminar)", super: "✓", sys: "✓", dir: "—", col: "—" },
              { resource: "Comentarios", super: "✓", sys: "✓", dir: "✓", col: "Solo propios" },
              { resource: "Usuarios (Crear/Editar)", super: "✓", sys: "✓", dir: "—", col: "—" },
              { resource: "Usuarios (Eliminar)", super: "✓", sys: "—", dir: "—", col: "—" },
              { resource: "Directores de Cuenta (CRUD)", super: "✓", sys: "✓", dir: "—", col: "—" },
              { resource: "Agencias/Cuentas/Equipos", super: "✓", sys: "✓", dir: "Editar", col: "—" },
              { resource: "Asignar a Cuentas/Equipos", super: "✓", sys: "✓", dir: "✓", col: "—" },
            ].map((row, i) => (
              <tr key={i} style={{ borderTop: "1px solid var(--divider)" }}>
                <td className="p-2 font-medium" style={{ color: "var(--text-primary)" }}>{row.resource}</td>
                <td className="p-2 text-center" style={{ color: "var(--accent-rose)" }}>{row.super}</td>
                <td className="p-2 text-center" style={{ color: "var(--accent-purple)" }}>{row.sys}</td>
                <td className="p-2 text-center" style={{ color: "var(--accent-amber)" }}>{row.dir}</td>
                <td className="p-2 text-center" style={{ color: "var(--accent-green)" }}>{row.col}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
          { q: "¿Cómo creo un proyecto?", a: "Ve a Proyectos &gt; Nuevo Proyecto. SUPERADMIN, SYSADMIN y DIRECTOR pueden crear proyectos." },
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
