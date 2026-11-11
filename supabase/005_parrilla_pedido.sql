-- =====================================================================
-- FREELIA · 005 Parrilla por pedido + nuevo flujo de aprobación
--   · piezas enlazadas a un pedido (brief)
--   · envíos agrupados con mensaje (review_requests) y rondas de cambios
--   · el cliente revisa en secuencia; avisos agrupados (sin spam)
-- =====================================================================

alter table public.posts add column if not exists brief_id uuid references public.briefs(id) on delete set null;
create index if not exists posts_brief_idx on public.posts(brief_id);
alter table public.posts add column if not exists round integer not null default 0;

create table if not exists public.review_requests (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  client_id   uuid not null references public.clients(id) on delete cascade,
  brief_id    uuid references public.briefs(id) on delete set null,
  message     text,
  post_ids    uuid[] not null default '{}',
  created_at  timestamptz not null default now()
);
create index if not exists review_requests_client_idx on public.review_requests(client_id, created_at desc);
alter table public.review_requests enable row level security;
drop policy if exists "creativo ve envios" on public.review_requests;
create policy "creativo ve envios" on public.review_requests for select using (public.is_owner(client_id));
drop policy if exists "cliente ve envios" on public.review_requests;
create policy "cliente ve envios" on public.review_requests for select using (public.is_client_user(client_id));

alter table public.posts add column if not exists review_request_id uuid references public.review_requests(id) on delete set null;

-- Envíos masivos: no notificar pieza por pieza
create or replace function public.notify_post_review() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_client uuid;
begin
  if coalesce(current_setting('freelia.bulk', true), '') = '1' then return new; end if;
  if new.status = 'en_revision' and (tg_op = 'INSERT' or old.status is distinct from 'en_revision') then
    select client_user_id into v_client from clients where id = new.client_id;
    perform notify(v_client, 'aprobacion', 'Tienes una pieza para aprobar', new.title, '/cliente/aprobaciones/' || new.id);
  end if;
  return new;
end $$;

-- Aviso agrupado al creativo sobre un envío (actualiza el aviso sin leer en vez de crear otro)
create or replace function public.notify_request_progress(p_request uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r record; v_owner uuid; v_name text; v_ok int; v_ch int; v_pend int; v_title text; v_body text; v_link text; v_id uuid;
begin
  select * into r from review_requests where id = p_request;
  if r.id is null then return; end if;
  select owner_id, coalesce(nullif(company, ''), name) into v_owner, v_name from clients where id = r.client_id;
  select count(*) filter (where status in ('aprobado','publicado')),
         count(*) filter (where status = 'cambios'),
         count(*) filter (where status = 'en_revision')
    into v_ok, v_ch, v_pend from posts where review_request_id = p_request;
  v_title := case when v_pend = 0 and v_ch = 0 then '✓ ' || v_name || ' aprobó todo el envío'
                  when v_pend = 0 then v_name || ' terminó de revisar'
                  else v_name || ' está revisando tu envío' end;
  v_body := v_ok || case when v_ok = 1 then ' aprobada' else ' aprobadas' end
    || case when v_ch > 0 then ' · ' || v_ch || ' con cambios' else '' end
    || case when v_pend > 0 then ' · ' || v_pend || ' por revisar' else '' end;
  v_link := '/panel/envios/' || p_request;
  select id into v_id from notifications
    where user_id = v_owner and link = v_link and read_at is null order by created_at desc limit 1;
  if v_id is not null then
    update notifications set title = v_title, body = v_body, created_at = now() where id = v_id;
  else
    perform notify(v_owner, 'revision', v_title, v_body, v_link);
  end if;
end $$;

-- El creativo envía un grupo de piezas a aprobación con un mensaje
create or replace function public.send_posts_for_review(p_posts uuid[], p_message text default null, p_resolve boolean default true)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_client uuid; v_n int; v_req uuid; v_brief uuid; v_user uuid; v_titles text;
begin
  if p_posts is null or array_length(p_posts, 1) is null then raise exception 'Elige al menos una pieza'; end if;
  select min(client_id::text)::uuid, count(distinct client_id) into v_client, v_n from posts where id = any(p_posts);
  if v_n <> 1 then raise exception 'Las piezas deben ser de un mismo cliente'; end if;
  if not public.is_owner(v_client) then raise exception 'No tienes permiso'; end if;
  select case when count(distinct brief_id) = 1 and count(*) = count(brief_id) then min(brief_id::text)::uuid end
    into v_brief from posts where id = any(p_posts);

  insert into review_requests(owner_id, client_id, brief_id, message, post_ids)
    select owner_id, id, v_brief, nullif(trim(coalesce(p_message, '')), ''), '{}' from clients where id = v_client
    returning id into v_req;

  perform set_config('freelia.bulk', '1', true);
  with u as (
    update posts set status = 'en_revision', round = case when status = 'en_revision' then greatest(round, 1) else round + 1 end, review_request_id = v_req
     where id = any(p_posts) and status in ('borrador', 'cambios', 'en_revision')
     returning id, title, scheduled_at)
  select count(*), string_agg(title, ', ' order by scheduled_at nulls last) into v_n, v_titles from u;
  perform set_config('freelia.bulk', '', true);
  if v_n = 0 then delete from review_requests where id = v_req; raise exception 'Esas piezas ya fueron aprobadas'; end if;

  update review_requests set post_ids = array(select id from posts where review_request_id = v_req) where id = v_req;
  if p_resolve then
    update post_comments set resolved = true where post_id = any(p_posts) and x is not null and resolved = false;
  end if;
  update briefs set status = 'en_proceso' where status = 'nuevo'
    and id in (select brief_id from posts where review_request_id = v_req and brief_id is not null);

  select client_user_id into v_user from clients where id = v_client;
  perform notify(v_user, 'aprobacion',
    case when v_n = 1 then 'Tienes 1 pieza para aprobar' else 'Tienes ' || v_n || ' piezas para aprobar' end,
    coalesce(nullif(trim(coalesce(p_message, '')), ''), v_titles), '/cliente/revisar/' || v_req);
  return v_req;
end $$;
grant execute on function public.send_posts_for_review(uuid[], text, boolean) to authenticated;

-- Revisión del cliente pieza por pieza (aviso agrupado si la pieza vino en un envío)
create or replace function public.review_post(p_post uuid, p_action text, p_comment text default null)
returns void language plpgsql security definer set search_path = public as $$
declare p record;
begin
  if p_action not in ('aprobado','cambios') then raise exception 'Acción no válida'; end if;
  select po.*, c.owner_id as c_owner, c.client_user_id into p
    from posts po join clients c on c.id = po.client_id where po.id = p_post;
  if p.id is null or p.client_user_id is distinct from auth.uid() then
    raise exception 'No tienes permiso para revisar esta pieza';
  end if;
  if p.status <> 'en_revision' then raise exception 'Esta pieza ya fue revisada'; end if;
  update posts set status = p_action where id = p_post;
  insert into post_comments(post_id, author_id, body, action)
  values (p_post, auth.uid(), nullif(trim(coalesce(p_comment,'')), ''), p_action);
  if p.review_request_id is not null then
    perform notify_request_progress(p.review_request_id);
  else
    perform notify(p.c_owner, 'revision',
      case when p_action = 'aprobado' then '✓ Pieza aprobada' else 'Piden cambios' end,
      p.title || coalesce(': ' || nullif(trim(coalesce(p_comment,'')), ''), ''),
      '/panel/parrilla/' || p.id);
  end if;
end $$;

-- El cliente aprueba varias piezas de una vez
create or replace function public.approve_posts(p_posts uuid[])
returns integer language plpgsql security definer set search_path = public as $$
declare v_n int; v_req uuid;
begin
  if exists (select 1 from posts where id = any(p_posts) and not public.is_client_user(client_id)) then
    raise exception 'No tienes permiso';
  end if;
  insert into post_comments(post_id, author_id, body, action)
    select id, auth.uid(), 'Aprobada junto con el resto del envío', 'aprobado' from posts where id = any(p_posts) and status = 'en_revision';
  update posts set status = 'aprobado' where id = any(p_posts) and status = 'en_revision';
  get diagnostics v_n = row_count;
  for v_req in select distinct review_request_id from posts where id = any(p_posts) and review_request_id is not null loop
    perform notify_request_progress(v_req);
  end loop;
  if v_n > 0 and not exists (select 1 from posts where id = any(p_posts) and review_request_id is not null) then
    perform notify((select c.owner_id from posts po join clients c on c.id = po.client_id where po.id = p_posts[1]),
      'revision', '✓ Aprobaron ' || v_n || case when v_n = 1 then ' pieza' else ' piezas' end, null, '/panel/parrilla');
  end if;
  return v_n;
end $$;
grant execute on function public.approve_posts(uuid[]) to authenticated;

-- Pines del cliente mientras revisa: no avisar uno por uno (el "Pedir cambios" ya avisa)
create or replace function public.notify_post_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record; v_title text;
begin
  if new.action <> 'comentario' then return new; end if;
  select po.id, po.title, po.status, c.owner_id, c.client_user_id into p
    from posts po join clients c on c.id = po.client_id where po.id = new.post_id;
  if new.x is not null and new.author_id = p.client_user_id and p.status = 'en_revision' then return new; end if;
  v_title := case when new.x is not null then '📍 Comentario sobre el arte · ' else '' end;
  if new.author_id = p.owner_id then
    perform notify(p.client_user_id, 'comentario', v_title || 'Nuevo comentario en ' || p.title, new.body, '/cliente/aprobaciones/' || p.id);
  else
    perform notify(p.owner_id, 'comentario', v_title || 'Tu cliente comentó ' || p.title, new.body, '/panel/parrilla/' || p.id);
  end if;
  return new;
end $$;
