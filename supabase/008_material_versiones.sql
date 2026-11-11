-- =====================================================================
-- FREELIA · 008 Solicitudes por tipo, material de cualquier tipo,
--               versiones por ronda y entrega final
-- =====================================================================

-- ---- Solicitudes con tipo -------------------------------------------
alter table public.briefs add column if not exists kind text not null default 'proyecto';
alter table public.briefs drop constraint if exists briefs_kind_check;
alter table public.briefs add constraint briefs_kind_check check (kind in ('proyecto','pieza','parrilla','campana','reunion'));
alter table public.briefs add column if not exists details jsonb not null default '{}';
alter table public.briefs add column if not exists meeting_at timestamptz;
alter table public.briefs add column if not exists meeting_link text;
alter table public.briefs add column if not exists delivered_at timestamptz;

-- Reunión confirmada / material entregado -> avisar al cliente
create or replace function public.notify_brief_update() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_client uuid;
begin
  select client_user_id into v_client from clients where id = new.client_id;
  if new.meeting_at is not null and new.meeting_at is distinct from old.meeting_at then
    perform notify(v_client, 'reunion', 'Reunión confirmada',
      new.title || ' · ' || to_char(new.meeting_at at time zone 'America/Bogota', 'DD/MM HH12:MI am'), '/cliente/solicitudes/' || new.id);
  end if;
  if new.delivered_at is not null and old.delivered_at is null then
    perform notify(v_client, 'entrega', '📦 Tu material está listo para descargar', new.title, '/cliente/solicitudes/' || new.id);
  end if;
  return new;
end $$;
drop trigger if exists briefs_notify_update on public.briefs;
create trigger briefs_notify_update after update of meeting_at, delivered_at on public.briefs
  for each row execute function public.notify_brief_update();

-- El cliente puede proponer/editar su solicitud mientras está nueva (ya puede insertar);
-- y ver la entrega. (Las políticas de lectura existentes ya cubren al cliente.)

-- ---- Material de cualquier tipo --------------------------------------
alter table public.posts add column if not exists assets jsonb not null default '[]';
alter table public.posts add column if not exists link_url text;
alter table public.posts add column if not exists social boolean not null default true;
alter table public.posts add column if not exists final_files jsonb not null default '[]';
alter table public.posts add column if not exists delivered_at timestamptz;
update public.posts set assets = jsonb_build_array(jsonb_build_object(
    'url', asset_url, 'name', 'arte',
    'type', case when asset_url ~* '\.(mp4|mov|webm)$' then 'video/mp4' else 'image/*' end))
  where asset_url is not null and assets = '[]'::jsonb;

alter table public.posts drop constraint if exists posts_status_check;
alter table public.posts add constraint posts_status_check
  check (status in ('borrador','en_revision','cambios','aprobado','publicado','entregado'));

-- Pines por archivo y por ronda
alter table public.post_comments add column if not exists asset_idx integer not null default 0;
alter table public.post_comments add column if not exists round integer;
create or replace function public.set_comment_round() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.round is null then select round into new.round from posts where id = new.post_id; end if;
  return new;
end $$;
drop trigger if exists post_comments_round on public.post_comments;
create trigger post_comments_round before insert on public.post_comments
  for each row execute function public.set_comment_round();
update public.post_comments c set round = p.round from public.posts p where p.id = c.post_id and c.round is null;

-- ---- Versiones (lo que vio el cliente en cada ronda) ----------------
create table if not exists public.post_versions (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  round       integer not null,
  assets      jsonb not null default '[]',
  copy        text,
  link_url    text,
  created_at  timestamptz not null default now(),
  unique (post_id, round)
);
alter table public.post_versions enable row level security;
drop policy if exists "ver versiones" on public.post_versions;
create policy "ver versiones" on public.post_versions for select using (
  exists (select 1 from posts p where p.id = post_id and (public.is_owner(p.client_id) or (public.is_client_user(p.client_id) and p.status <> 'borrador'))));

-- Guardar una versión cada vez que el material se envía a revisión
create or replace function public.snapshot_post_version() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'en_revision' and (old.status is distinct from 'en_revision' or new.round is distinct from old.round) then
    insert into post_versions(post_id, round, assets, copy, link_url)
    values (new.id, greatest(new.round, 1), new.assets, new.copy, new.link_url)
    on conflict (post_id, round) do update set assets = excluded.assets, copy = excluded.copy, link_url = excluded.link_url, created_at = now();
  end if;
  return new;
end $$;
drop trigger if exists posts_snapshot on public.posts;
create trigger posts_snapshot after update of status, round on public.posts
  for each row execute function public.snapshot_post_version();

-- Versión 1 para lo que ya está en revisión o revisado
insert into public.post_versions(post_id, round, assets, copy, link_url)
  select id, greatest(round, 1), assets, copy, link_url from public.posts
  where status <> 'borrador' and assets <> '[]'::jsonb
on conflict do nothing;

-- ---- Entrega final ---------------------------------------------------
-- El creativo entrega una solicitud: marca las piezas aprobadas como entregadas
create or replace function public.deliver_brief(p_brief uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare b record; v_n int;
begin
  select * into b from briefs where id = p_brief;
  if b.id is null or not public.is_owner(b.client_id) then raise exception 'No tienes permiso'; end if;
  update posts set status = 'entregado', delivered_at = now()
    where brief_id = p_brief and status in ('aprobado', 'publicado');
  get diagnostics v_n = row_count;
  update briefs set delivered_at = now(), status = 'completado' where id = p_brief;
  return v_n;
end $$;
grant execute on function public.deliver_brief(uuid) to authenticated;

-- Entrega de una pieza suelta -> avisar al cliente (en entregas de solicitud completa se avisa una sola vez)
create or replace function public.notify_post_delivered() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_client uuid;
begin
  if coalesce(current_setting('freelia.bulk', true), '') = '1' then return new; end if;
  if new.delivered_at is not null and new.delivered_at is distinct from old.delivered_at then
    select client_user_id into v_client from clients where id = new.client_id;
    perform notify(v_client, 'entrega', '📦 ' || new.title || ' está lista para descargar', null, '/cliente/aprobaciones/' || new.id);
  end if;
  return new;
end $$;
drop trigger if exists posts_notify_delivered on public.posts;
create trigger posts_notify_delivered after update of delivered_at on public.posts
  for each row execute function public.notify_post_delivered();

create or replace function public.deliver_brief(p_brief uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare b record; v_n int;
begin
  select * into b from briefs where id = p_brief;
  if b.id is null or not public.is_owner(b.client_id) then raise exception 'No tienes permiso'; end if;
  perform set_config('freelia.bulk', '1', true);
  update posts set status = 'entregado', delivered_at = now()
    where brief_id = p_brief and status in ('aprobado', 'publicado', 'entregado');
  get diagnostics v_n = row_count;
  perform set_config('freelia.bulk', '', true);
  update briefs set delivered_at = now(), status = 'completado' where id = p_brief;
  return v_n;
end $$;
