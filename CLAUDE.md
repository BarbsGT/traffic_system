# AgencyGrid — Visibilidad 360° para tu agencia

## Stack
- Next.js 16 (App Router)
- React 19
- Supabase (Auth, DB, Realtime)
- Tailwind CSS 4
- Lucide React (icons)
- Recharts (charts)
- Geist (font)

## CSS Conventions
- Use `var(--text-primary)`, `var(--accent-cyan)`, etc. for all colors
- No hardcoded dark mode colors (e.g., `text-white`, `bg-gray-900`)
- Glassmorphism: `.glass` for cards, `.sidebar-glass` for sidebar
- Theme toggle sets `data-theme` on `<html>` + localStorage `agencygrid-theme`

## Database
- Tables: profiles, projects, tasks, comments, project_messages
- Catalogs: agencies, accounts, teams, directors
- Junction: profile_accounts, profile_teams
- Audit: task_history
- RLS enabled on all tables
- Realtime enabled for comments, project_messages, tasks

## Roles (hierarchical)
- SUPERADMIN > SYSADMIN > DIRECTOR > COLABORADOR
- SUPERADMIN/SYSADMIN: full access
- DIRECTOR: manages teams/projects
- COLABORADOR: assigned tasks only
