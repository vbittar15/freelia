-- =====================================================================
-- FREELIA · 005 Parrilla enlazada a un pedido / brief
-- =====================================================================

alter table public.posts add column if not exists brief_id uuid references public.briefs(id) on delete set null;
create index if not exists posts_brief_idx on public.posts(brief_id);

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

-- El creativo envía toda la parrilla del pedido a aprobación (un solo aviso)
create or replace function public.send_brief_for_review(p_brief uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare b record; v_n integer; v_client uuid;
begin
  select * into b from briefs where id = p_brief;
  if b.id is null or not public.is_owner(b.client_id) then raise exception 'No tienes permiso'; end if;
  perform set_config('freelia.bulk', '1', true);
  update posts set status = 'en_revision' where brief_id = p_brief and status in ('borrador', 'cambios');
  get diagnostics v_n = row_count;
  perform set_config('freelia.bulk', '', true);
  if v_n = 0 then return 0; end if;
  if b.status = 'nuevo' then update briefs set status = 'en_proceso' where id = p_brief; end if;
  select client_user_id into v_client from clients where id = b.client_id;
  perform notify(v_client, 'aprobacion', 'Tu parrilla está lista para aprobar',
    b.title || ' · ' || v_n || case when v_n = 1 then ' pieza' else ' piezas' end, '/cliente/solicitudes/' || p_brief);
  return v_n;
end $$;
grant execute on function public.send_brief_for_review(uuid) to authenticated;

-- El cliente aprueba de una vez todas las piezas en revisión del pedido
create or replace function public.approve_brief_posts(p_brief uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare b record; v_n integer; v_owner uuid;
begin
  select * into b from briefs where id = p_brief;
  if b.id is null or not public.is_client_user(b.client_id) then raise exception 'No tienes permiso'; end if;
  insert into post_comments(post_id, author_id, body, action)
    select id, auth.uid(), 'Aprobada con toda la parrilla', 'aprobado' from posts where brief_id = p_brief and status = 'en_revision';
  update posts set status = 'aprobado' where brief_id = p_brief and status = 'en_revision';
  get diagnostics v_n = row_count;
  if v_n = 0 then return 0; end if;
  select owner_id into v_owner from clients where id = b.client_id;
  perform notify(v_owner, 'revision', '✓ Aprobaron la parrilla',
    b.title || ' · ' || v_n || case when v_n = 1 then ' pieza aprobada' else ' piezas aprobadas' end, '/panel/briefs/' || p_brief);
  return v_n;
end $$;
grant execute on function public.approve_brief_posts(uuid) to authenticated;
