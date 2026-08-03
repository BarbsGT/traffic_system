# AgencyGrid — Visibilidad 360° para tu agencia
## Web App para agencias de publicidad

### Next.js 16 + Supabase + Tailwind CSS + Glassmorphism

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint check

## Env (.env.local)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (NEVER exposed to browser). Required for `adminCreateUser` server action (creación de usuarios en `/admin/users`). Get it from Supabase Dashboard > Settings > API > service_role.

## Architecture
- `/src/app/(app)/` — Authenticated routes (protected by AppShell)
- `/src/app/login/` — Public auth route
- `/src/app/auth/callback/` — Supabase OAuth callback
- `/src/app/actions/` — Server actions (e.g. `users.ts` adminCreateUser)
- `/src/components/` — Shared components
- `/src/utils/supabase/` — Supabase client/server/admin helpers
- `/supabase/` — SQL migrations and seed data

## Key Conventions
- Glassmorphism via `.glass` and `.sidebar-glass` classes
- CSS variables for theme (no hardcoded dark colors)
- Role-based access: SUPERADMIN, SYSADMIN, DIRECTOR, COLABORADOR
- Realtime subscriptions use Supabase channel
- All supabase queries go through `src/utils/supabase/client.ts`
- Server-only admin ops (create users, role changes) go through `src/utils/supabase/admin.ts` (service role, bypasses RLS) inside `src/app/actions/`
- `profile_accounts.manager_id` = manager/director específico por cuenta (un usuario puede tener managers distintos en cada cuenta)

## Roles y Visibilidad (RLS)
- **Panel General** (`/dashboard`) es SOLO para SUPERADMIN/SYSADMIN. El sidebar lo oculta a DIRECTOR/COLABORADOR y `AppShell.tsx` redirige a `/projects` si intentan acceder por URL. El login redirige según rol (`homePathFor`).
- **Visibilidad por asignación (condición vinculante cuentas+proyectos)**: `accounts_select` exige `can_access_account(id)` y `agencies_select` exige `is_sysadmin() OR EXISTS(cuenta accesible)`. En `can_access_project`, el acceso total a los proyectos de la cuenta (`can_access_account`) aplica SOLO para DIRECTOR/SYSADMIN/SUPERADMIN; el COLABORADOR solo ve proyectos donde es dueño (`owner_id`) o tiene tareas asignadas a su id (`tasks.assignee_id`). Proyectos/tareas/comentarios/chat filtran por `can_access_project`.
- Los usuarios seed de `seed_*.sql` (maria, pedro, sofia…) están en `profiles`/`auth.users` pero NO devuelve `admin.auth.admin.listUsers()` (API devuelve paginado/limitado); no bloquea nada funcional.
