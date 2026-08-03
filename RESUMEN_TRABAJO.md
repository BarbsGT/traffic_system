# AgencyGrid — Resumen de Trabajo y Estado Actual

> Documento de retomada: qué se construyó, qué hay pendiente y cómo seguir.

---

## 1. Descripción del proyecto

**AgencyGrid** — Web App para agencias de publicidad. Administra múltiples cuentas, marcas, equipos y proyectos con trazabilidad total de tiempo/costo por cliente.

- **Stack:** Next.js 16 (App Router) + Turbopack + Supabase + Tailwind CSS + Glassmorphism
- **Repositorio:** `https://github.com/JosRod919/synapse_traffic_system`
- **Branch:** `master`

---

## 2. Comandos de desarrollo

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npx playwright test` | Suite de QA E2E (Playwright) |

**Importante:** tras cada `git pull` ejecutar `npm install` (hay dependencias como `@playwright/test` que el TS checker exige).

---

## 3. Estructura actual

### Rutas (App Router)
| Ruta | Contenido |
|---|---|
| `/login`, `/auth/callback`, `/auth/reset-password` | Autenticación pública |
| `/dashboard` | Panel General |
| `/projects/account-dashboard` | Dashboard Ejecutivo (ejecutivos de cuenta) |
| `/projects` y `/projects/[id]`, `/projects/[id]/chat` | Proyectos y chat |
| `/tasks` | Tareas |
| `/alerts` | Alertas y recomendaciones (blocked/vencidas) |
| `/strategic` | Dashboard estratégico |
| `/profile` | Perfil del usuario |
| `/admin/catalogos` | Catálogos: Agencias, Cuentas, Equipos, Áreas, Directores de Cuenta |
| `/admin/users` | Usuarios: listado, crear, editar, desactivar, asignaciones, árbol |
| `/guias` | Guía de uso con matriz de permisos |

### Componentes clave
- `src/components/layout/SidebarNav.tsx` + `SidebarHeader.tsx` — navegación con roles
- `src/components/gantt/DailyGanttModule.tsx` + `DailyGanttTimeline.tsx` + `useDailyGanttData.ts` — **timeline diario** con breakdown por proyecto, filtros y sticky columns
- `src/components/AccountTimeline.tsx` — timeline por cuenta
- `src/components/AccountExecutiveDashboard.tsx` — dashboard de ejecutivos
- `src/components/ExecutiveDashboard.tsx`, `StrategicDashboard.tsx`, `TrafficMatrix.tsx`, `BlockedAlerts.tsx`
- `src/components/traffic/UATrafficMatrix.tsx` — matriz de tráfico UA (Under Armour)
- `src/components/tasks/StatusBadge.tsx`

### SQL de Supabase (`supabase/`)
| Archivo | Contenido |
|---|---|
| `migration_all.sql` | Esquema completo (tablas, enums, triggers, seeds) |
| `migration_rbac_v3.sql` | RBAC v3 + helper functions (`is_superadmin`, `is_sysadmin`, `is_director`) |
| `migration_unify_projects.sql` | Unifica tablas de tráfico UA dentro de `projects` |
| `migration_areas.sql` | Catálogo de áreas + seed inicial |
| `migration_directors_account.sql` | Columna `account_id` en `directors` |
| `migration_profile_accounts_manager.sql` | Columna `manager_id` en `profile_accounts` (manager/director por cuenta) |
| `migration_security_hardening.sql` | Seguridad E2E: bloquea escalada de privilegios en `profiles` y aísla lecturas por cuenta/equipo/rol (solo `authenticated`) |
| `migration_task_details.sql`, `migration_completed_at.sql` | Detalles de tarea, `completed_at` |
| `seed_*`, `update_brands_to_ua.sql` | Seeds y migraciones de datos |

---

## 4. Trabajo realizado (historial de commits)

### `39a8e20` — Gantt + QA + limpieza (último, traído de GitHub)
- **Nuevo módulo Gantt diario** (`src/components/gantt/*`): timeline diario con breakdown por proyecto, filtros y sticky columns.
- **QA Playwright 20/20** (`tests/qa-full.spec.ts` + `playwright.config.ts`).
- **Nuevo** `SidebarHeader.tsx`, `AccountTimeline.tsx`, `migration_completed_at.sql`.
- **Limpieza**: se eliminaron componentes legacy de tráfico (`TrafficTable`, `TrafficAccordionGroup`, `TrafficFilterBar`, `TrafficLightHeader`, `TrafficDataRow`, `TaskDetailPanel`, `AnalyticsSidebar`, `HierarchyBrowser`, `CreateProjectModal`, `CreateTaskModal`), `HierarchyDashboard`, `AdminPanel`, `FileManager`, `GlobalChatDrawer`, `TaskActivityFeed`, telemetry, y varios SQLs obsoletos.

### `424b167` — Mesa de Tráfico eliminada + unificación + RBAC v3
- Se eliminó la sección "Mesa de Tráfico" (`/traffic`).
- Se unificaron las tablas de tráfico UA dentro de `projects` (migración `migration_unify_projects.sql`).
- **RBAC v3** (`migration_rbac_v3.sql`): SUPERADMIN CRUD total, SYSADMIN casi total, DIRECTOR CRUD proyectos/tareas y gestión de asignaciones, COLABORADOR ve y actualiza sus tareas.
- **Catálogos** (`/admin/catalogos`): CRUD completo de Agencias, Cuentas, Equipos, **Áreas**, y **Directores de Cuenta** (vinculados a Cuenta/Marca, no a Equipo).
- **Usuarios** (`/admin/users`): crear usuario (auth), editar rol/posición/manager/capacidad, desactivar, **tab de asignaciones** (usuario → cuentas y equipos), árbol de colaboradores.
- **Filtro por cuenta**: al crear/asignar una tarea, un DIRECTOR solo ve los colaboradores asignados a su(s) cuenta(s) (`profile_accounts`).
- Eliminado texto "SaaS B2B" de metadatos y documentación.

### `c50a6bd` — Mesa de Tráfico Viva
- Página unificada de tráfico con jerarquía, analytics, detalle de tareas, modales de creación, forgot password y branding Under Armour.

### Migraciones previas
- IDs de enum idempotentes (`IF NOT EXISTS`), consolidación de migraciones, tabla `domains`, seeds completos, RBAC v1/v2, jerarquía de colaboradores, chat con RLS.

---

## 5. Roles y permisos (RBAC v3)

| Rol | Permisos |
|---|---|
| **SUPERADMIN** | Acceso total. CRUD de todo: proyectos, tareas, usuarios, directores de cuenta, cuentas, agencias, equipos, áreas. |
| **SYSADMIN** | CRUD casi total (no borra en tablas críticas; solo SUPERADMIN elimina). |
| **DIRECTOR** | Crea/edita proyectos y tareas, asigna colaboradores de su(s) cuenta(s), administra catálogos. |
| **COLABORADOR** | Visualiza, actualiza sus propias tareas. |

---

## 6. Migraciones PENDIENTES de ejecutar en Supabase (SQL Editor)

Verificar si ya se aplicaron; si no, ejecutar en orden:
1. `migration_rbac_v3.sql`
2. `migration_unify_projects.sql`
3. `migration_areas.sql`
4. `migration_directors_account.sql`
5. `migration_profile_accounts_manager.sql`
6. `migration_security_hardening.sql`
7. `migration_completed_at.sql`
8. `migration_task_details.sql`

> ⚠️ `migration_security_hardening.sql` **cambia el comportamiento**: después de aplicarla,
> SUPERADMIN/SYSADMIN ven todo; DIRECTOR y COLABORADOR solo ven datos de las cuentas a las que
> están asignados (`profile_accounts`, `profile_teams` o `directors`). Asigna las cuentas en
> `/admin/users → Asignaciones` antes de validar.

---

## 7. Cómo retomar el trabajo

1. `git pull` y `npm install`.
2. Aplicar las migraciones pendientes de la sección 6 en Supabase.
3. Configurar `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` — obligatoria para crear usuarios en `/admin/users` (Settings > API > service_role). Nunca exponer al navegador.
4. `npm run dev` → http://localhost:3000
5. Verificar build con `npm run build` y QA con `npx playwright test`.

---

## 8. Creación de usuarios (flujo actual)

- El botón **Nuevo Usuario** en `/admin/users` muestra un formulario con: nombre, email, contraseña, **rol, posición, descripción, capacidad, manager global**, **cuentas asignadas (cada una con su propio manager/director)** y **equipos asignados**.
- La creación se hace vía **server action** `adminCreateUser` (`src/app/actions/users.ts`) con la **service role key**:
  - Crea el usuario en `auth.users` (confirmado automáticamente).
  - Actualiza el perfil (rol, posición, capacidad, etc.).
  - Inserta las asignaciones en `profile_accounts` (con `manager_id` por cuenta) y `profile_teams`.
- Sin `SUPABASE_SERVICE_ROLE_KEY` la creación falla con un mensaje claro.
- Un usuario puede tener **varios managers/distintos por cuenta** (`profile_accounts.manager_id`), además del `manager_id` global del perfil.

---

## 9. Próximos pasos sugeridos

- Vincular el catálogo **Áreas** a los proyectos/tareas (el `areas` ya existe en BD, pero `UATrafficMatrix` aún usa la constante `AREAS` hardcodeada).
- Decidir si la tabla `directors` mantiene `team_id` legacy o se depura.
- Completar la vista de **asignaciones** con asignación directa desde el perfil del usuario.
- Revisar los 4 vulnerabilities de `npm audit`.
