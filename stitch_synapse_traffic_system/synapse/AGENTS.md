# Kairos — El momento exacto
## Synapse Traffic System

### Next.js 16 + Supabase + Tailwind CSS + Glassmorphism

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint check

## Architecture
- `/src/app/(app)/` — Authenticated routes (protected by AppShell)
- `/src/app/login/` — Public auth route
- `/src/app/auth/callback/` — Supabase OAuth callback
- `/src/components/` — Shared components
- `/src/utils/supabase/` — Supabase client/server helpers
- `/supabase/` — SQL migrations and seed data

## Key Conventions
- Glassmorphism via `.glass` and `.sidebar-glass` classes
- CSS variables for theme (no hardcoded dark colors)
- Role-based access: SUPERADMIN, SYSADMIN, DIRECTOR, COLABORADOR
- Realtime subscriptions use Supabase channel
- All supabase queries go through `src/utils/supabase/client.ts`
