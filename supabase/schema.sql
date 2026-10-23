-- Laboratorio IFVG · tabla de progreso por persona.
-- Ejecutar una vez en Supabase: SQL Editor → New query → pegar → Run.

create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  state      jsonb not null,
  updated_at timestamptz not null default now()
);

-- Solo las personas con sesión iniciada usan la tabla; los anónimos no tienen acceso.
revoke all on public.progress from anon;
grant select, insert, update, delete on public.progress to authenticated;

-- Cada persona solo puede ver y cambiar su propia fila.
alter table public.progress enable row level security;

drop policy if exists "leer mi progreso" on public.progress;
create policy "leer mi progreso" on public.progress
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "crear mi progreso" on public.progress;
create policy "crear mi progreso" on public.progress
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "actualizar mi progreso" on public.progress;
create policy "actualizar mi progreso" on public.progress
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "borrar mi progreso" on public.progress;
create policy "borrar mi progreso" on public.progress
  for delete to authenticated using ((select auth.uid()) = user_id);
