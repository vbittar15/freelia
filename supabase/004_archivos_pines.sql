-- =====================================================================
-- FREELIA · 004 Archivos en chat y pedidos + comentarios sobre la imagen
-- =====================================================================

-- Adjuntos en el chat
alter table public.messages add column if not exists attachment_url text;
alter table public.messages add column if not exists attachment_name text;
alter table public.messages add column if not exists attachment_type text;
alter table public.messages drop constraint if exists messages_body_check;
alter table public.messages alter column body set default '';
alter table public.messages add constraint messages_body_or_file
  check (length(trim(body)) > 0 or attachment_url is not null);

-- Adjuntos en briefs / pedidos: [{ "url": "...", "name": "...", "type": "..." }]
alter table public.briefs add column if not exists attachments jsonb not null default '[]'::jsonb;

-- Comentarios con posición sobre el arte (0 a 1) y estado resuelto
alter table public.post_comments add column if not exists x real;
alter table public.post_comments add column if not exists y real;
alter table public.post_comments add column if not exists resolved boolean not null default false;

drop policy if exists "creativo resuelve comentarios" on public.post_comments;
create policy "creativo resuelve comentarios" on public.post_comments for update
  using (exists (select 1 from posts p where p.id = post_id and public.is_owner(p.client_id)))
  with check (exists (select 1 from posts p where p.id = post_id and public.is_owner(p.client_id)));

-- El aviso de mensaje muestra el archivo si no hay texto
create or replace function public.notify_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare c record; v_body text;
begin
  select owner_id, client_user_id, name, company into c from clients where id = new.client_id;
  v_body := coalesce(nullif(left(new.body, 140), ''), '📎 ' || coalesce(new.attachment_name, 'Archivo'));
  if new.sender_id = c.owner_id then
    perform notify(c.client_user_id, 'mensaje', 'Nuevo mensaje', v_body, '/cliente/mensajes/' || new.client_id);
  else
    perform notify(c.owner_id, 'mensaje', 'Mensaje de ' || coalesce(c.company, c.name), v_body, '/panel/mensajes/' || new.client_id);
  end if;
  return new;
end $$;

-- El aviso de comentario indica si va sobre la imagen
create or replace function public.notify_post_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record; v_title text;
begin
  if new.action <> 'comentario' then return new; end if;
  select po.id, po.title, c.owner_id, c.client_user_id into p
    from posts po join clients c on c.id = po.client_id where po.id = new.post_id;
  v_title := case when new.x is not null then '📍 Comentario sobre el arte · ' else '' end;
  if new.author_id = p.owner_id then
    perform notify(p.client_user_id, 'comentario', v_title || 'Nuevo comentario en ' || p.title, new.body, '/cliente/aprobaciones/' || p.id);
  else
    perform notify(p.owner_id, 'comentario', v_title || 'Tu cliente comentó ' || p.title, new.body, '/panel/parrilla/' || p.id);
  end if;
  return new;
end $$;
