-- =====================================================================
-- FREELIA · 007 Rubros, servicios, paquetes, ajustes y tutorial
-- =====================================================================

alter table public.profiles add column if not exists specialties text[] not null default '{}';
alter table public.profiles add column if not exists settings jsonb not null default '{}';
alter table public.profiles add column if not exists onboarded_at timestamptz;
-- Quien ya usaba la app no necesita la bienvenida
update public.profiles set onboarded_at = now() where onboarded_at is null and role = 'creative'
  and exists (select 1 from public.clients c where c.owner_id = profiles.id);

-- Catálogo de servicios
create table if not exists public.services (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  name        text not null,
  description text,
  category    text,
  unit        text not null default 'proyecto',
  price       numeric(14,2) not null default 0,
  active      boolean not null default true,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists services_owner_idx on public.services(owner_id, position);
alter table public.services enable row level security;
drop policy if exists "creativo gestiona servicios" on public.services;
create policy "creativo gestiona servicios" on public.services for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Paquetes (combinan servicios con un precio especial)
create table if not exists public.packages (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  name        text not null,
  description text,
  period      text not null default 'unico' check (period in ('unico','mensual')),
  price       numeric(14,2) not null default 0,
  items       jsonb not null default '[]',
  active      boolean not null default true,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists packages_owner_idx on public.packages(owner_id, position);
alter table public.packages enable row level security;
drop policy if exists "creativo gestiona paquetes" on public.packages;
create policy "creativo gestiona paquetes" on public.packages for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
