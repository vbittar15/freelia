-- =====================================================================

-- FREELIA · 009 Avisos sin emojis (texto limpio en notificaciones y push)

-- =====================================================================

create or replace function public.notify_post_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record; v_title text;
begin
  if new.action <> 'comentario' then return new; end if;
  select po.id, po.title, po.status, c.owner_id, c.client_user_id into p
    from posts po join clients c on c.id = po.client_id where po.id = new.post_id;
  if new.x is not null and new.author_id = p.client_user_id and p.status = 'en_revision' then return new; end if;
  v_title := case when new.x is not null then 'Comentario sobre el material · ' else '' end;
  if new.author_id = p.owner_id then
    perform notify(p.client_user_id, 'comentario', v_title || 'Nuevo comentario en ' || p.title, new.body, '/cliente/aprobaciones/' || p.id);
  else
    perform notify(p.owner_id, 'comentario', v_title || 'Tu cliente comentó ' || p.title, new.body, '/panel/parrilla/' || p.id);
  end if;
  return new;
end $$;

create or replace function public.notify_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare c record; v_body text;
begin
  select owner_id, client_user_id, name, company into c from clients where id = new.client_id;
  v_body := coalesce(nullif(left(new.body, 140), ''), 'Archivo: ' || coalesce(new.attachment_name, 'adjunto'));
  if new.sender_id = c.owner_id then
    perform notify(c.client_user_id, 'mensaje', 'Nuevo mensaje', v_body, '/cliente/mensajes/' || new.client_id);
  else
    perform notify(c.owner_id, 'mensaje', 'Mensaje de ' || coalesce(c.company, c.name), v_body, '/panel/mensajes/' || new.client_id);
  end if;
  return new;
end $$;

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
      case when p_action = 'aprobado' then 'Pieza aprobada' else 'Piden cambios' end,
      p.title || coalesce(': ' || nullif(trim(coalesce(p_comment,'')), ''), ''),
      '/panel/parrilla/' || p.id);
  end if;
end $$;

create or replace function public.respond_quote(p_quote uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public as $$
declare q record;
begin
  select qu.*, c.client_user_id into q from quotes qu join clients c on c.id = qu.client_id where qu.id = p_quote;
  if q.id is null or q.client_user_id is distinct from auth.uid() then
    raise exception 'No tienes permiso';
  end if;
  if q.status <> 'enviada' then raise exception 'Esta cotización ya fue respondida'; end if;
  update quotes set status = case when p_accept then 'aceptada' else 'rechazada' end where id = p_quote;
  perform notify(q.owner_id, 'cotizacion',
    case when p_accept then 'Cotización aceptada' else 'Cotización rechazada' end,
    q.title, '/panel/cotizaciones/' || q.id);
end $$;

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
  v_title := case when v_pend = 0 and v_ch = 0 then v_name || ' aprobó todo el envío'
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
      'revision', 'Aprobaron ' || v_n || case when v_n = 1 then ' pieza' else ' piezas' end, null, '/panel/parrilla');
  end if;
  return v_n;
end $$;

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
    perform notify(v_client, 'entrega', 'Tu material está listo para descargar', new.title, '/cliente/solicitudes/' || new.id);
  end if;
  return new;
end $$;

create or replace function public.notify_post_delivered() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_client uuid;
begin
  if coalesce(current_setting('freelia.bulk', true), '') = '1' then return new; end if;
  if new.delivered_at is not null and new.delivered_at is distinct from old.delivered_at then
    select client_user_id into v_client from clients where id = new.client_id;
    perform notify(v_client, 'entrega', new.title || ' está lista para descargar', null, '/cliente/aprobaciones/' || new.id);
  end if;
  return new;
end $$;
