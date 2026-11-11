-- =====================================================================
-- FREELIA · 002 Invitaciones con enlace único
-- Ejecutar DESPUÉS de schema.sql (Supabase > SQL Editor > Run).
-- El cliente se conecta solo con su enlace único, no por coincidencia de correo.
-- =====================================================================

alter table public.clients add column if not exists invite_token uuid not null default gen_random_uuid();
create unique index if not exists clients_invite_token_idx on public.clients(invite_token);

-- Ya no se vincula por correo (era inseguro sin verificación de correo)
drop trigger if exists clients_link_user on public.clients;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_token uuid;
begin
  insert into profiles(id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data->>'role' = 'client' then 'client' else 'creative' end
  );
  -- Si se registró desde un enlace de invitación, se conecta a esa ficha
  begin
    v_token := nullif(new.raw_user_meta_data->>'invite', '')::uuid;
  exception when others then v_token := null;
  end;
  if v_token is not null then
    update clients set client_user_id = new.id
     where invite_token = v_token and client_user_id is null;
  end if;
  return new;
end $$;

-- Datos públicos mínimos de una invitación (para la página del enlace)
create or replace function public.invite_info(p_token uuid)
returns table(client_name text, company text, creative_name text, linked boolean)
language sql stable security definer set search_path = public as $$
  select c.name, c.company, coalesce(p.business_name, p.full_name), c.client_user_id is not null
    from clients c join profiles p on p.id = c.owner_id
   where c.invite_token = p_token and not c.archived;
$$;
grant execute on function public.invite_info(uuid) to anon, authenticated;

-- Aceptar una invitación con una cuenta que ya existe
create or replace function public.accept_invite(p_token uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_owner uuid;
begin
  if auth.uid() is null then raise exception 'Inicia sesión primero'; end if;
  select id, owner_id into v_id, v_owner from clients
   where invite_token = p_token and not archived
     and (client_user_id is null or client_user_id = auth.uid());
  if v_id is null then raise exception 'Este enlace ya fue usado o no es válido'; end if;
  if v_owner = auth.uid() then raise exception 'Este enlace es para tu cliente, no para ti'; end if;
  update clients set client_user_id = auth.uid() where id = v_id;
  -- Si no tiene clientes propios, su cuenta pasa a ser de cliente
  update profiles set role = 'client'
   where id = auth.uid() and not exists (select 1 from clients where owner_id = auth.uid());
  return v_id;
end $$;
grant execute on function public.accept_invite(uuid) to authenticated;
