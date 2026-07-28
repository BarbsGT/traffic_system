# Kairos — El momento exacto

Sistema de gestión de tráfico Synapse con autenticación Supabase,
panel de vidrio esmerilado (glassmorphism), y jerarquía de 5 niveles:
Agencia → Cuenta → Equipo → Proyecto → Tarea.

## Stack

- Next.js 16 (App Router)
- React 19
- Supabase (Auth + DB + Realtime)
- Tailwind CSS 4
- Lucide React
- Recharts
- Geist Font

## Roles

| Rol | Permisos |
|-----|----------|
| SUPERADMIN | Todo el sistema |
| SYSADMIN | Gestión completa |
| DIRECTOR | Equipos y proyectos |
| COLABORADOR | Tareas asignadas |
