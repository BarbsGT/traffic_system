-- ============================================================
-- Fase B: RPC get_ua_matrix — un solo round-trip para la Matriz
-- de Tráfico (proyectos ua_traffic + sus tareas) por cuenta.
--
-- IMPORTANTE:
--   * security invoker -> el RPC ejecuta bajo el rol del cliente con
--     SESSION_USER. RLS (specs/multi-tenant) se aplica fila a fila
--     tal igual que las queries del cliente. NO rompe el aislamiento.
--   * set search_path = public -> evita hijacking por search_path.
--   * Aplica este archivo en el SQL Editor de Supabase.
-- ============================================================

create or replace function public.get_ua_matrix(p_account_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'projects', coalesce(
      (select jsonb_agg(p order by p.created_at desc)
         from public.projects p
        where p.type = 'ua_traffic'
          and p.account_id = p_account_id),
      '[]'::jsonb
    ),
    'tasks', coalesce(
      (select jsonb_agg(t order by t.created_at asc)
         from public.tasks t
         join public.projects p on p.id = t.project_id
        where p.type = 'ua_traffic'
          and p.account_id = p_account_id),
      '[]'::jsonb
    )
  );
$$;

revoke all on function public.get_ua_matrix(uuid) from public;
grant execute on function public.get_ua_matrix(uuid) to authenticated;
grant execute on function public.get_ua_matrix(uuid) to anon;