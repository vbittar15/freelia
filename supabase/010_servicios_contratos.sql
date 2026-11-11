-- =====================================================================
-- FREELIA · 010 Servicios por cliente y contratos con firma electrónica
-- =====================================================================

-- ---- Servicios que se le prestan a cada cliente ----------------------
create table if not exists public.client_services (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  client_id   uuid not null references public.clients(id) on delete cascade,
  service_id  uuid references public.services(id) on delete set null,
  package_id  uuid references public.packages(id) on delete set null,
  name        text not null,
  includes    text,
  qty         numeric(10,2) not null default 1,
  price       numeric(14,2) not null default 0,
  period      text not null default 'mensual' check (period in ('mensual','unico')),
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists client_services_client_idx on public.client_services(client_id, position);
alter table public.client_services enable row level security;
drop policy if exists "creativo gestiona servicios del cliente" on public.client_services;
create policy "creativo gestiona servicios del cliente" on public.client_services for all
  using (public.is_owner(client_id)) with check (public.is_owner(client_id));
drop policy if exists "cliente ve sus servicios" on public.client_services;
create policy "cliente ve sus servicios" on public.client_services for select using (public.is_client_user(client_id));

-- ---- Contratos -------------------------------------------------------
create table if not exists public.contracts (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  client_id          uuid not null references public.clients(id) on delete cascade,
  number             integer not null default 0,
  title              text not null default 'Contrato de prestación de servicios',
  body               text not null default '',
  services           jsonb not null default '[]',
  terms              jsonb not null default '{}',
  status             text not null default 'borrador' check (status in ('borrador','enviado','firmado','anulado')),
  creative_name      text,
  creative_doc       text,
  sent_at            timestamptz,
  signed_at          timestamptz,
  signer_name        text,
  signer_doc         text,
  signer_email       text,
  signature          text,           -- trazo de la firma (imagen PNG en base64)
  signer_ip          text,
  signer_agent       text,
  body_hash          text,           -- huella SHA-256 del texto firmado
  created_at         timestamptz not null default now()
);
create index if not exists contracts_client_idx on public.contracts(client_id, created_at desc);
alter table public.contracts enable row level security;
drop policy if exists "creativo gestiona contratos" on public.contracts;
create policy "creativo gestiona contratos" on public.contracts for all
  using (public.is_owner(client_id)) with check (public.is_owner(client_id));
drop policy if exists "cliente ve sus contratos" on public.contracts;
create policy "cliente ve sus contratos" on public.contracts for select
  using (public.is_client_user(client_id) and status in ('enviado','firmado'));

-- Consecutivo por creativo
create or replace function public.next_contract_number() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.number := coalesce((select max(number) from contracts where owner_id = new.owner_id), 0) + 1;
  return new;
end $$;
drop trigger if exists contracts_zz_number on public.contracts;
create trigger contracts_zz_number before insert on public.contracts
  for each row execute function public.next_contract_number();

-- Un contrato firmado ya no se puede modificar (solo anular)
create or replace function public.protect_signed_contract() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'firmado' and coalesce(current_setting('freelia.signing', true), '') <> '1' then
    if new.status = 'anulado' and new.body = old.body and new.signature is not distinct from old.signature then return new; end if;
    raise exception 'Este contrato ya está firmado y no se puede modificar';
  end if;
  return new;
end $$;
drop trigger if exists contracts_protect on public.contracts;
create trigger contracts_protect before update on public.contracts
  for each row execute function public.protect_signed_contract();

-- Avisos: enviado -> cliente
create or replace function public.notify_contract() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_client uuid;
begin
  if new.status = 'enviado' and old.status is distinct from 'enviado' then
    select client_user_id into v_client from clients where id = new.client_id;
    perform notify(v_client, 'contrato', 'Tienes un contrato para firmar', new.title, '/cliente/contratos/' || new.id);
  end if;
  return new;
end $$;
drop trigger if exists contracts_notify on public.contracts;
create trigger contracts_notify after update of status on public.contracts
  for each row execute function public.notify_contract();

-- El cliente firma
create or replace function public.sign_contract(p_contract uuid, p_name text, p_doc text, p_signature text,
  p_hash text, p_ip text default null, p_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
declare k record; v_email text; v_cli text;
begin
  select * into k from contracts where id = p_contract;
  if k.id is null or not public.is_client_user(k.client_id) then raise exception 'No tienes permiso'; end if;
  if k.status <> 'enviado' then raise exception 'Este contrato no está pendiente de firma'; end if;
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_doc), '') = '' then raise exception 'Escribe tu nombre y documento'; end if;
  if p_signature is null or p_signature not like 'data:image/png;base64,%' or length(p_signature) < 200 then raise exception 'Dibuja tu firma'; end if;
  if length(p_signature) > 400000 then raise exception 'La firma es demasiado grande'; end if;
  if p_hash is distinct from encode(sha256(convert_to(k.body, 'UTF8')), 'hex') then
    raise exception 'El contrato cambió mientras lo leías. Recarga la página y vuelve a revisarlo.';
  end if;
  select email into v_email from profiles where id = auth.uid();
  perform set_config('freelia.signing', '1', true);
  update contracts set status = 'firmado', signed_at = now(), signer_name = trim(p_name), signer_doc = trim(p_doc),
    signer_email = v_email, signature = p_signature, signer_ip = left(p_ip, 80), signer_agent = left(p_agent, 300), body_hash = p_hash
  where id = p_contract;
  perform set_config('freelia.signing', '', true);
  select coalesce(nullif(company, ''), name) into v_cli from clients where id = k.client_id;
  perform notify(k.owner_id, 'contrato', v_cli || ' firmó el contrato', k.title, '/panel/contratos/' || k.id);
end $$;
grant execute on function public.sign_contract(uuid, text, text, text, text, text, text) to authenticated;
