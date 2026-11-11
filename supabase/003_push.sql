-- =====================================================================
-- FREELIA · 003 Notificaciones push (app instalable)
-- Ejecutar DESPUÉS de 002. Luego, en una consulta aparte, guarda la
-- configuración privada (ver el final de este archivo).
-- =====================================================================

create extension if not exists pg_net;

-- Suscripciones push de cada dispositivo
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
create policy "mis suscripciones" on public.push_subscriptions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Configuración privada (no expuesta por la API)
create schema if not exists private;
create table if not exists private.config (key text primary key, value text not null);
revoke all on schema private from anon, authenticated;

-- Cada notificación nueva se envía como push a los dispositivos del usuario
create or replace function public.push_on_notification() returns trigger
language plpgsql security definer set search_path = public, private as $$
declare v_url text; v_secret text; v_subs jsonb;
begin
  select value into v_url from private.config where key = 'push_url';
  select value into v_secret from private.config where key = 'push_secret';
  if v_url is null or v_secret is null then return new; end if;
  select coalesce(jsonb_agg(jsonb_build_object('endpoint', endpoint, 'keys', jsonb_build_object('p256dh', p256dh, 'auth', auth))), '[]'::jsonb)
    into v_subs from push_subscriptions where user_id = new.user_id;
  if jsonb_array_length(v_subs) = 0 then return new; end if;
  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', v_secret),
    body := jsonb_build_object('title', new.title, 'body', coalesce(new.body, ''), 'link', coalesce(new.link, '/'), 'tag', new.type, 'subscriptions', v_subs)
  );
  return new;
exception when others then
  return new; -- nunca bloquear la notificación por un fallo del push
end $$;

drop trigger if exists notifications_push on public.notifications;
create trigger notifications_push after insert on public.notifications
  for each row execute function public.push_on_notification();

-- Limpieza de suscripciones vencidas (la llama /api/push con el secreto)
create or replace function public.remove_push_subscriptions(p_secret text, p_endpoints text[])
returns void language plpgsql security definer set search_path = public, private as $$
begin
  if p_secret is distinct from (select value from private.config where key = 'push_secret') then
    raise exception 'No autorizado';
  end if;
  delete from push_subscriptions where endpoint = any(p_endpoints);
end $$;
grant execute on function public.remove_push_subscriptions(text, text[]) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Configuración (ejecutar aparte con tus valores; NO subir a GitHub):
-- insert into private.config(key, value) values
--   ('push_url', 'https://TU-DOMINIO/api/push'),
--   ('push_secret', 'EL-MISMO-PUSH_SECRET-DE-VERCEL')
-- on conflict (key) do update set value = excluded.value;
-- ---------------------------------------------------------------------
