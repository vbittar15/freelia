-- =====================================================================
-- FREELIA · 011 Marca por cliente, módulos, parrilla real y cobros completos
-- =====================================================================

-- ---- Marca y módulos por cliente -------------------------------------
alter table public.clients add column if not exists logo_url text;
alter table public.clients add column if not exists brandbook_url text;
alter table public.clients add column if not exists brand jsonb not null default '{}';
alter table public.clients add column if not exists modules jsonb not null
  default '{"parrilla":true,"solicitudes":true,"cotizaciones":true,"cobros":true,"contratos":true,"chat":true}';

-- Marca propia del creativo (para sus documentos)
alter table public.profiles add column if not exists logo_url text;
alter table public.profiles add column if not exists brand_color text;

-- ---- Parrilla de contenido real ---------------------------------------
alter table public.posts add column if not exists networks text[] not null default '{}';
alter table public.posts add column if not exists topic text;
alter table public.posts add column if not exists idea text;
alter table public.posts add column if not exists art_text text;
alter table public.posts add column if not exists notes text;
update public.posts set networks = array[network] where networks = '{}' and network is not null and network <> 'entrega' and social;

-- ---- Cobros completos -------------------------------------------------
alter table public.invoices add column if not exists tax_rate numeric(5,2) not null default 0;        -- IVA %
alter table public.invoices add column if not exists withholding_rate numeric(5,2) not null default 0; -- retención %
alter table public.invoices add column if not exists discount numeric(14,2) not null default 0;
alter table public.invoices add column if not exists period text;                                     -- 'YYYY-MM' si es del mes
alter table public.invoices add column if not exists reminded_at timestamptz;

-- Total a pagar de una cuenta de cobro
create or replace function public.invoice_total(p_invoice uuid) returns numeric
language sql stable security definer set search_path = public as $$
  select round(greatest(0, sub - i.discount) * (1 + i.tax_rate / 100) - greatest(0, sub - i.discount) * i.withholding_rate / 100)
  from invoices i, lateral (select coalesce(sum(quantity * unit_price), 0) sub from invoice_items where invoice_id = i.id) s
  where i.id = p_invoice;
$$;
grant execute on function public.invoice_total(uuid) to authenticated;

create table if not exists public.invoice_payments (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references public.invoices(id) on delete cascade,
  amount       numeric(14,2) not null check (amount > 0),
  paid_on      date not null default current_date,
  method       text not null default 'transferencia',
  reference    text,
  proof_url    text,
  note         text,
  confirmed    boolean not null default false,
  created_by   uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists invoice_payments_invoice_idx on public.invoice_payments(invoice_id);
alter table public.invoice_payments enable row level security;
drop policy if exists "creativo gestiona pagos" on public.invoice_payments;
create policy "creativo gestiona pagos" on public.invoice_payments for all
  using (exists (select 1 from invoices i where i.id = invoice_id and public.is_owner(i.client_id)))
  with check (exists (select 1 from invoices i where i.id = invoice_id and public.is_owner(i.client_id)));
drop policy if exists "cliente ve pagos" on public.invoice_payments;
create policy "cliente ve pagos" on public.invoice_payments for select
  using (exists (select 1 from invoices i where i.id = invoice_id and i.status <> 'borrador' and public.is_client_user(i.client_id)));
drop policy if exists "cliente reporta pago" on public.invoice_payments;
create policy "cliente reporta pago" on public.invoice_payments for insert
  with check (confirmed = false and exists (select 1 from invoices i where i.id = invoice_id and i.status = 'enviada' and public.is_client_user(i.client_id)));

-- Al registrar o confirmar pagos: avisar y marcar pagada cuando se completa
create or replace function public.on_invoice_payment() returns trigger
language plpgsql security definer set search_path = public as $$
declare i record; v_paid numeric; v_total numeric; v_cli text;
begin
  select * into i from invoices where id = new.invoice_id;
  if tg_op = 'INSERT' and not new.confirmed then
    select coalesce(nullif(company, ''), name) into v_cli from clients where id = i.client_id;
    perform notify(i.owner_id, 'cobro', v_cli || ' reportó un pago', 'Cuenta de cobro N.º ' || i.number || ' · $' || replace(to_char(new.amount, 'FM999G999G999'), ',', '.'), '/panel/cobros/' || i.id);
  end if;
  select coalesce(sum(amount), 0) into v_paid from invoice_payments where invoice_id = new.invoice_id and confirmed;
  v_total := public.invoice_total(new.invoice_id);
  if v_paid >= v_total and v_total > 0 and i.status <> 'pagada' then
    update invoices set status = 'pagada', paid_at = now() where id = i.id;
  end if;
  return new;
end $$;
drop trigger if exists invoice_payments_after on public.invoice_payments;
create trigger invoice_payments_after after insert or update of confirmed, amount on public.invoice_payments
  for each row execute function public.on_invoice_payment();

-- Cuenta de cobro pagada -> avisar al cliente
create or replace function public.notify_invoice() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_client uuid;
begin
  select client_user_id into v_client from clients where id = new.client_id;
  if new.status = 'enviada' and (tg_op = 'INSERT' or old.status is distinct from 'enviada') then
    perform notify(v_client, 'cobro', 'Tienes una cuenta de cobro', new.concept, '/cliente/cobros/' || new.id);
  elsif new.status = 'pagada' and tg_op = 'UPDATE' and old.status is distinct from 'pagada' then
    perform notify(v_client, 'cobro', 'Pago recibido. ¡Gracias!', 'Cuenta de cobro N.º ' || new.number, '/cliente/cobros/' || new.id);
  end if;
  return new;
end $$;

-- Las cuentas ya pagadas quedan con su pago registrado
insert into public.invoice_payments(invoice_id, amount, paid_on, method, confirmed, note)
  select i.id, public.invoice_total(i.id), coalesce(i.paid_at::date, current_date), 'transferencia', true, 'Registrado al actualizar Freelia'
  from public.invoices i
  where i.status = 'pagada' and not exists (select 1 from public.invoice_payments p where p.invoice_id = i.id)
    and public.invoice_total(i.id) > 0;
