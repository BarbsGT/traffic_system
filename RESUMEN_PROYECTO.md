# RESUMEN DEL PROYECTO — AgencyGrid / Synapse Traffic System

> Resumen ejecutivo y técnico de la aplicación, su arquitectura, módulos,
> base de datos, roles y estado actual.

---

## 1. Descripción general

**AgencyGrid** es una Web App para **agencias de publicidad** que centraliza la
gestión de **múltiples cuentas, marcas, equipos y proyectos**, ofreciendo
- **Visibilidad 360°** sobre la operación,
- **aislamiento multi-marca/por cuenta** (seguridad por asignación), y
- **trazabilidad total de tiempo y costo por cliente** (tareas, horas estimadas, tráfico).

Se desarrolló como *Synapse Traffic System* (Proyecto de **Under Armour** / cuenta
UA), para gestionar el **tráfico** de campañas digitales y equipos creativos.

---

## 2. Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | **Next.js 16** (App Router) + Turbopack |
| UI | **React 19** + Tailwind CSS 4 + Glassmorphism |
| Font | Geist Sans / Geist Mono |
| Backend / BBDD | **Supabase** (Auth + PostgreSQL + Realtime + RLS) |
| Gráficos | Recharts |
| Iconos | Lucide React |
| Testing / QA | Playwright (suite E2E + suite de auditoría) |
| Analytics | @vercel/analytics + @vercel/speed-insights |
| Gestión | TypeScript 5, ESLint 9 |

- Repositorio: `github.com/JosRod919/synapse_traffic_system` · Branch: `master`

---

## 3. Arquitectura y rutas (App Router)

```
/public                     # Assets estáticos
/src
 ├─ app/                    # Rutas
 │   ├─ page.tsx            # Landing pública (login provider)
 │   ├─ login/              # Autenticación
 │   ├─ auth/callback       # Callback OAuth de Supabase
 │   ├─ auth/reset-password # Recuperación de contraseña
 │   ├─ actions/users.ts    # Server actions (adminCreateUser)
 │   └─ (app)/              # Rutas autenticadas (protegidas por AppShell)
 │        ├─ dashboard/     # Panel General (solo SUPERADMIN/SYSADMIN)
 │        ├─ projects/       # Proyectos, dashboard de cuenta, chat
 │        ├─ tasks/          # Tareas
 │        ├─ alerts/         # Alertas y recomendaciones (blocked/vencidas)
 │        ├─ strategic/      # Dashboard estratégico
 │        ├─ profile/        # Perfil del usuario
 │        ├─ guias/          # Guía de uso y matriz de permisos
 │        └─ admin/          # catalogos/ (catálogos) y users/ (gestión)
 ├─ components/             # Componentes compartidos (UI, layout, gantt, tasks, traffic)
 ├─ lib/                    # dashboard, directory, uamatrix, utils
 └─ utils/                  # csv, taskAlerts y helpers de supabase (client/server/admin)
supabase/                   # Migraciones SQL y seeds
tests/                      # Playwright (qa-full, audit-director, audit-superadmin, auth.setup)
```

### Rutas principales
| Ruta | Contenido |
|---|---|
| `/dashboard` | Panel General |
| `/projects`, `/projects/[id]`, `/projects/[id]/chat` | Proyectos, detalle y chat |
| `/projects/account-dashboard` | Dashboard Ejecutivo (ejecutivos de cuenta) |
| `/tasks` | Tareas y tráfico |
| `/alerts` | Alertas de bloqueo/vencidas |
| `/strategic` | Dashboard estratégico |
| `/admin/catalogos` | Catálogos: Agencias, Cuentas, Equipos, Áreas, Directores |
| `/admin/users` | Usuarios: CRUD, roles, asignaciones, árbol |
| `/guias` | Guía de uso |

---

## 4. Modelo de datos (Supabase / PostgreSQL)

Tablas principales (ver `supabase/migration_all.sql`):

- **profiles** — usuarios (`auth.users`), rol, posición, capacidad, manager global.
- **projects** — proyectos (incluye proyectos de tráfico `type = 'ua_traffic'`);
  jerarquía vía `parent_id`.
- **tasks** — tareas con `estimated_hours`, fechas, `assignee_id`, subtareas
  (`parent_task_id`), `completed_at`, `delivered_at`.
- **comments** y **project_messages** — comentarios de tareas y mensajes de proyecto.
- **agencies** / **accounts** / **teams** / **directors** — estructura de agencia,
  cuentas (marcas), equipos y directores de cuenta.
- **profile_accounts** / **profile_teams** — asignaciones usuario→cuenta y
  usuario→equipo; `profile_accounts.manager_id` **por cuenta** (un usuario puede
  tener managers distintos por cuenta).
- **chat_rooms** / **chat_messages** — chat con RLS.
- **task_history** — historial/auditoría de tareas.
- **domains** / **excel_columns** / **areas** — catálogos y utilidades.

Enums: `user_role`, `task_status`, `task_priority`.

**Seguridad:** RLS activo en la mayoría de tablas; políticas segmentadas por
cuenta/equipo/rol y helpers SQL (`is_superadmin`, `is_sysadmin`, `is_director`,
`can_access_account`, `can_access_project`). Realtime en `tasks`, `comments` y
`project_messages`.

---

## 5. Roles y permisos (RBAC v3)

| Rol | Permisos |
|-----|----------|
| **SUPERADMIN** | CRUD total en todo el sistema. |
| **SYSADMIN** | CRUD casi total (no elimina datos críticos). |
| **DIRECTOR** | CRUD de proyectos/tareas y gestión de asignaciones de colaboradores de su(s) cuenta(s). |
| **COLABORADOR** | Ve y actualiza sus propias tareas. |

**Visibilidad (RLS):**
- `/dashboard` es **solo** para SUPERADMIN/SYSADMIN (sidebar lo oculta y
  `AppShell.tsx` redirige a `/projects`).
- El acceso se define por asignación: `accounts_select` exige `can_access_account`,
  `agencies_select` exige sysadmin o cuenta accesible; proyectos/tareas/comentarios/chat
  filtran por `can_access_project`. El COLABORADOR solo ve proyectos donde es dueño o
  tiene tareas asignadas.

---

## 6. Funcionalidades destacadas

- **Traffic / Tráfico UA** — Matriz de tráfico (Creative) con áreas, tiers (Gold/
  Silver/Bronze), presupuestos, fechas de brief y lanzamiento, estados creativos,
  y edición por columnas (archivo `src/components/traffic/UATrafficMatrix.tsx`);
  carga optimizada vía RPC `get_ua_matrix` con fallback (`src/lib/uamatrix.ts`).
- **Gantt diario** (`src/components/gantt/*`) — timeline con desglose por proyecto,
  filtros y columnas fijas.
- **Alertas** (`BlockedAlerts`) — tareas en rojo/vencidas y recomendaciones.
- **Dashboards** — General (SUPERADMIN), Ejecutivo por cuenta, Estratégico y
  Matriz de tráfico.
- **Admin** — gestión de catálogos y usuarios con **server action de creación de
  usuarios** usando la `SUPABASE_SERVICE_ROLE_KEY`.
- **Chat abierto**, **perfil** y **guía de uso**.

---

## 7. Configuración de entorno (`.env.local`)

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima (pública) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Service role** (solo servidor, nunca al navegador). Requerido por `adminCreateUser` en `/admin/users` (Dashboard → Settings → API → service_role). |

---

## 8. Comandos de desarrollo

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run deploy:preview` / `npm run deploy:prod` | Despliegue a Vercel |
| `npx playwright test` | Suite de QA E2E |

> Tras cada `git pull` ejecutar `npm install` (Playwright y dependencias de TS).

---

## 9. Migraciones de Supabase (`supabase/`)

- `migration_all.sql` — esquema completo (tablas, enums, triggers, seeds).
- `migration_rbac_v3.sql` — RBAC v3 + helpers de permisos.
- `migration_unify_projects.sql` — unifica tablas de tráfico UA en `projects`.
- `migration_areas.sql` — catálogo de áreas.
- `migration_directors_account.sql` — `account_id` en `directors`.
- `migration_profile_accounts_manager.sql` — `manager_id` por cuenta.
- `migration_security_hardening.sql` — seguridad E2E (bloquea escalada, aísla lecturas).
- `migration_task_details.sql`, `migration_completed_at.sql`, `migration_task_alert_status.sql`.
- `migration_teams_global.sql`, `migration_accounts_global.sql`, `migration_gerente_*.sql`,
  `migration_can_access_manager.sql`, `migration_colaborador_viewonly.sql`,
  `migration_phaseA_hardening.sql`, `migration_phaseB_rpc_matriu.sql`,
  `migration_profile_accounts_manager.sql`, `migration_purge_seed_revoke.sql`.
- `seed_*.sql` y `update_brands_to_ua.sql` — datos de prueba/UA.

---

## 10. Estado y pendientes (sugeridos)

- Enlazar el catálogo **Áreas** con proyectos/tareas (la BD ya lo tiene, pero
  `UATrafficMatrix` aún usa el array `AREAS` hardcodeado).
- Decidir si `directors.team_id` (legacy) se mantiene o se depura.
- Completar la vista de asignaciones desde el perfil del usuario.
- Revisar los `npm audit` (vulnerabilities pendientes).

---

## 11. Documentación relacionada

- `README.md` — punto de entrada breve.
- `AGENTS.md` — convenciones de arquitectura, comandos, env y RBAC.
- `DESIGN.md` — sistema de diseño (glassmorphism, paleta, tokens, tipografía).
- `RESUMEN_TRABAJO.md` — historial de work (commits y retomada).

---

*Generado: 2026-08-05 · Documento de resumen ejecutivo del proyecto AgencyGrid ✓*