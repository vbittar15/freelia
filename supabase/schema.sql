-- =====================================================================
-- FREELIA · Esquema de base de datos (Supabase / Postgres)
-- Pega todo este archivo en Supabase > SQL Editor > New query > Run.
-- Es seguro ejecutarlo una sola vez en un proyecto nuevo.
-- =====================================================================

-- gen_random_uuid() viene incluido en Postgres 13+ (Supabase lo tiene)

-- ---------------------------------------------------------------------
-- 1. PERFILES (un perfil por cada usuario que se registra)
-- ---------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text,
  role          text not null default 'creative' check (role in ('creative','client')),
  business_name text,   -- nombre comercial / marca personal
  document_id   text,   -- cédula o NIT (para cuentas de cobro)
  city          text,
  phone         text,
  bank_info     text,   -- datos bancarios para recibir pagos
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. CLIENTES (cada creativo tiene sus clientes)
--    client_user_id se llena solo cuando el cliente crea su cuenta
--    con el mismo correo.
-- ---------------------------------------------------------------------
create table public.clients (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  client_user_id  uuid references public.profiles(id) on delete set null,
  name            text not null,       -- nombre de la persona de contacto
  company         text,                -- marca / empresa
  email           text,
  phone           text,
  document_id     text,                -- NIT o cédula del cliente
  color           text default '#C9D6FF',
  notes           text,
  archived        boolean not null default false,
  created_at      timestamptz not null default now()
);
create index on public.clients(owner_id);
create index on public.clients(client_user_id);
create index on public.clients(lower(email));

-- ---------------------------------------------------------------------
-- 3. BRIEFS / SOLICITUDES
-- ---------------------------------------------------------------------
create table public.briefs (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  client_id     uuid not null references public.clients(id) on delete cascade,
  created_by    uuid not null default auth.uid() references public.profiles(id),
  title         text not null,
  objective     text,
  audience      text,
  key_message   text,
  deliverables  text,
  refs          text,   -- referencias / links
  deadline      date,
  budget        numeric(14,2),
  status        text not null default 'nuevo' check (status in ('nuevo','en_proceso','completado')),
  created_at    timestamptz not null default now()
);
create index on public.briefs(client_id);

-- ---------------------------------------------------------------------
-- 4. PARRILLA DE CONTENIDO + APROBACIONES
-- ---------------------------------------------------------------------
create table public.posts (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  client_id     uuid not null references public.clients(id) on delete cascade,
  title         text not null,
  network       text not null default 'instagram',
  format        text not null default 'post',
  scheduled_at  timestamptz,
  copy          text,
  asset_url     text,
  status        text not null default 'borrador'
                check (status in ('borrador','en_revision','cambios','aprobado','publicado')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on public.posts(client_id, scheduled_at);

create table public.post_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  author_id   uuid not null default auth.uid() references public.profiles(id),
  body        text,
  action      text not null default 'comentario' check (action in ('comentario','aprobado','cambios')),
  created_at  timestamptz not null default now()
);
create index on public.post_comments(post_id);

-- ---------------------------------------------------------------------
-- 5. COTIZACIONES
-- ---------------------------------------------------------------------
create table public.quotes (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  client_id    uuid not null references public.clients(id) on delete cascade,
  number       integer not null,
  title        text not null,
  status       text not null default 'borrador' check (status in ('borrador','enviada','aceptada','rechazada')),
  valid_until  date,
  notes        text,
  created_at   timestamptz not null default now()
);
create table public.quote_items (
  id           uuid primary key default gen_random_uuid(),
  quote_id     uuid not null references public.quotes(id) on delete cascade,
  description  text not null,
  quantity     numeric(12,2) not null default 1,
  unit_price   numeric(14,2) not null default 0,
  position     integer not null default 0
);

-- ---------------------------------------------------------------------
-- 6. CUENTAS DE COBRO
-- ---------------------------------------------------------------------
create table public.invoices (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  client_id    uuid not null references public.clients(id) on delete cascade,
  number       integer not null,
  concept      text not null,
  issue_date   date not null default current_date,
  due_date     date,
  status       text not null default 'borrador' check (status in ('borrador','enviada','pagada')),
  notes        text,
  paid_at      timestamptz,
  created_at   timestamptz not null default now()
);
create table public.invoice_items (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references public.invoices(id) on delete cascade,
  description  text not null,
  quantity     numeric(12,2) not null default 1,
  unit_price   numeric(14,2) not null default 0,
  position     integer not null default 0
);

-- ---------------------------------------------------------------------
-- 7. CHAT (una conversación por cliente)
-- ---------------------------------------------------------------------
create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  sender_id   uuid not null default auth.uid() references public.profiles(id),
  body        text not null check (length(trim(body)) > 0),
  created_at  timestamptz not null default now()
);
create index on public.messages(client_id, created_at);

-- ---------------------------------------------------------------------
-- 8. NOTIFICACIONES
-- ---------------------------------------------------------------------
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,
  title       text not null,
  body        text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index on public.notifications(user_id, created_at desc);

-- =====================================================================
-- FUNCIONES DE AYUDA (seguridad)
-- =====================================================================
create or replace function public.is_owner(p_client uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from clients where id = p_client and owner_id = auth.uid());
$$;

create or replace function public.is_client_user(p_client uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from clients where id = p_client and client_user_id = auth.uid());
$$;

create or replace function public.can_access_client(p_client uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from clients
                 where id = p_client and (owner_id = auth.uid() or client_user_id = auth.uid()));
$$;

create or replace function public.is_related_profile(p_profile uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from clients c
                 where (c.owner_id = auth.uid() and c.client_user_id = p_profile)
                    or (c.client_user_id = auth.uid() and c.owner_id = p_profile));
$$;

create or replace function public.notify(p_user uuid, p_type text, p_title text, p_body text, p_link text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user is not null then
    insert into notifications(user_id, type, title, body, link)
    values (p_user, p_type, p_title, p_body, p_link);
  end if;
end $$;

-- =====================================================================
-- TRIGGERS
-- =====================================================================

-- Crear perfil automáticamente al registrarse
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles(id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data->>'role' = 'client' then 'client' else 'creative' end
  );
  -- Vincular con fichas de cliente que tengan ese correo
  update clients set client_user_id = new.id
   where client_user_id is null and lower(email) = lower(new.email);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Si el creativo crea un cliente cuyo correo ya tiene cuenta, se vincula de una vez
create or replace function public.link_client_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email is not null and (tg_op = 'INSERT' or new.email is distinct from old.email) then
    new.client_user_id := (select id from profiles where lower(email) = lower(new.email) limit 1);
  end if;
  return new;
end $$;

create trigger clients_link_user
  before insert or update of email on public.clients
  for each row execute function public.link_client_user();

-- owner_id siempre se toma del cliente (evita inconsistencias)
create or replace function public.set_owner_from_client() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.owner_id := (select owner_id from clients where id = new.client_id);
  return new;
end $$;

create trigger briefs_owner   before insert on public.briefs   for each row execute function public.set_owner_from_client();
create trigger posts_owner    before insert on public.posts    for each row execute function public.set_owner_from_client();
create trigger quotes_owner   before insert on public.quotes   for each row execute function public.set_owner_from_client();
create trigger invoices_owner before insert on public.invoices for each row execute function public.set_owner_from_client();

-- Consecutivos por creativo (Cotización #1, #2... / Cuenta de cobro #1, #2...)
-- Postgres ejecuta los triggers BEFORE en orden alfabético: "zz_" garantiza
-- que el consecutivo se calcule después de asignar owner_id.
create or replace function public.next_quote_number() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.number := coalesce((select max(number) from quotes where owner_id = new.owner_id), 0) + 1;
  return new;
end $$;
create trigger quotes_zz_number before insert on public.quotes
  for each row execute function public.next_quote_number();

create or replace function public.next_invoice_number() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.number := coalesce((select max(number) from invoices where owner_id = new.owner_id), 0) + 1;
  return new;
end $$;
create trigger invoices_zz_number before insert on public.invoices
  for each row execute function public.next_invoice_number();

-- updated_at de posts
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

-- ---- Notificaciones automáticas ----

-- Pieza enviada a revisión -> avisar al cliente
create or replace function public.notify_post_review() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_client uuid;
begin
  if new.status = 'en_revision' and (tg_op = 'INSERT' or old.status is distinct from 'en_revision') then
    select client_user_id into v_client from clients where id = new.client_id;
    perform notify(v_client, 'aprobacion', 'Tienes una pieza para aprobar',
                   new.title, '/cliente/aprobaciones/' || new.id);
  end if;
  return new;
end $$;
create trigger posts_notify after insert or update of status on public.posts
  for each row execute function public.notify_post_review();

-- Comentario en una pieza -> avisar a la otra parte
create or replace function public.notify_post_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record;
begin
  if new.action <> 'comentario' then return new; end if;
  select po.id, po.title, c.owner_id, c.client_user_id into p
    from posts po join clients c on c.id = po.client_id where po.id = new.post_id;
  if new.author_id = p.owner_id then
    perform notify(p.client_user_id, 'comentario', 'Nuevo comentario en ' || p.title, new.body, '/cliente/aprobaciones/' || p.id);
  else
    perform notify(p.owner_id, 'comentario', 'Tu cliente comentó ' || p.title, new.body, '/panel/parrilla/' || p.id);
  end if;
  return new;
end $$;
create trigger post_comments_notify after insert on public.post_comments
  for each row execute function public.notify_post_comment();

-- Nuevo mensaje -> avisar a la otra parte
create or replace function public.notify_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare c record;
begin
  select owner_id, client_user_id, name, company into c from clients where id = new.client_id;
  if new.sender_id = c.owner_id then
    perform notify(c.client_user_id, 'mensaje', 'Nuevo mensaje', left(new.body, 140), '/cliente/mensajes/' || new.client_id);
  else
    perform notify(c.owner_id, 'mensaje', 'Mensaje de ' || coalesce(c.company, c.name), left(new.body, 140), '/panel/mensajes/' || new.client_id);
  end if;
  return new;
end $$;
create trigger messages_notify after insert on public.messages
  for each row execute function public.notify_message();

-- Solicitud nueva creada por el cliente -> avisar al creativo
create or replace function public.notify_brief() returns trigger
language plpgsql security definer set search_path = public as $$
declare c record;
begin
  select owner_id, client_user_id, name, company into c from clients where id = new.client_id;
  if new.created_by <> c.owner_id then
    perform notify(c.owner_id, 'solicitud', 'Nueva solicitud de ' || coalesce(c.company, c.name), new.title, '/panel/briefs/' || new.id);
  else
    perform notify(c.client_user_id, 'brief', 'Nuevo brief compartido', new.title, '/cliente/solicitudes/' || new.id);
  end if;
  return new;
end $$;
create trigger briefs_notify after insert on public.briefs
  for each row execute function public.notify_brief();

-- Cotización enviada -> avisar al cliente
create or replace function public.notify_quote() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_client uuid;
begin
  if new.status = 'enviada' and (tg_op = 'INSERT' or old.status is distinct from 'enviada') then
    select client_user_id into v_client from clients where id = new.client_id;
    perform notify(v_client, 'cotizacion', 'Recibiste una cotización', new.title, '/cliente/cotizaciones/' || new.id);
  end if;
  return new;
end $$;
create trigger quotes_notify after insert or update of status on public.quotes
  for each row execute function public.notify_quote();

-- Cuenta de cobro enviada -> avisar al cliente
create or replace function public.notify_invoice() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_client uuid;
begin
  if new.status = 'enviada' and (tg_op = 'INSERT' or old.status is distinct from 'enviada') then
    select client_user_id into v_client from clients where id = new.client_id;
    perform notify(v_client, 'cobro', 'Tienes una cuenta de cobro', new.concept, '/cliente/cobros/' || new.id);
  end if;
  return new;
end $$;
create trigger invoices_notify after insert or update of status on public.invoices
  for each row execute function public.notify_invoice();

-- =====================================================================
-- ACCIONES DEL CLIENTE (funciones seguras)
-- =====================================================================

-- Aprobar o pedir cambios en una pieza
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
  update posts set status = p_action where id = p_post;
  insert into post_comments(post_id, author_id, body, action)
  values (p_post, auth.uid(), nullif(trim(coalesce(p_comment,'')), ''), p_action);
  perform notify(p.c_owner, 'revision',
    case when p_action = 'aprobado' then '✓ Pieza aprobada' else 'Piden cambios' end,
    p.title || coalesce(': ' || nullif(trim(coalesce(p_comment,'')), ''), ''),
    '/panel/parrilla/' || p.id);
end $$;

-- Aceptar o rechazar una cotización
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
    case when p_accept then '✓ Cotización aceptada' else 'Cotización rechazada' end,
    q.title, '/panel/cotizaciones/' || q.id);
end $$;

-- Marcar notificaciones como leídas
create or replace function public.mark_notifications_read()
returns void language sql security definer set search_path = public as $$
  update notifications set read_at = now() where user_id = auth.uid() and read_at is null;
$$;

-- =====================================================================
-- SEGURIDAD POR FILAS (RLS): cada quien ve solo lo suyo
-- =====================================================================
alter table public.profiles       enable row level security;
alter table public.clients        enable row level security;
alter table public.briefs         enable row level security;
alter table public.posts          enable row level security;
alter table public.post_comments  enable row level security;
alter table public.quotes         enable row level security;
alter table public.quote_items    enable row level security;
alter table public.invoices       enable row level security;
alter table public.invoice_items  enable row level security;
alter table public.messages       enable row level security;
alter table public.notifications  enable row level security;

-- Perfiles
create policy "ver mi perfil y relacionados" on public.profiles for select
  using (id = auth.uid() or public.is_related_profile(id));
create policy "editar mi perfil" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- Clientes
create policy "creativo gestiona sus clientes" on public.clients for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "cliente ve su ficha" on public.clients for select
  using (client_user_id = auth.uid());

-- Briefs
create policy "creativo gestiona briefs" on public.briefs for all
  using (public.is_owner(client_id)) with check (public.is_owner(client_id));
create policy "cliente ve briefs" on public.briefs for select
  using (public.is_client_user(client_id));
create policy "cliente crea solicitudes" on public.briefs for insert
  with check (public.is_client_user(client_id) and created_by = auth.uid());

-- Parrilla
create policy "creativo gestiona parrilla" on public.posts for all
  using (public.is_owner(client_id)) with check (public.is_owner(client_id));
create policy "cliente ve piezas enviadas" on public.posts for select
  using (public.is_client_user(client_id) and status <> 'borrador');

create policy "ver comentarios" on public.post_comments for select
  using (exists (select 1 from posts p where p.id = post_id and public.can_access_client(p.client_id)));
create policy "comentar" on public.post_comments for insert
  with check (author_id = auth.uid() and action = 'comentario'
              and exists (select 1 from posts p where p.id = post_id and public.can_access_client(p.client_id)));

-- Cotizaciones
create policy "creativo gestiona cotizaciones" on public.quotes for all
  using (public.is_owner(client_id)) with check (public.is_owner(client_id));
create policy "cliente ve cotizaciones" on public.quotes for select
  using (public.is_client_user(client_id) and status <> 'borrador');
create policy "creativo gestiona items cotizacion" on public.quote_items for all
  using (exists (select 1 from quotes q where q.id = quote_id and public.is_owner(q.client_id)))
  with check (exists (select 1 from quotes q where q.id = quote_id and public.is_owner(q.client_id)));
create policy "cliente ve items cotizacion" on public.quote_items for select
  using (exists (select 1 from quotes q where q.id = quote_id and q.status <> 'borrador' and public.is_client_user(q.client_id)));

-- Cuentas de cobro
create policy "creativo gestiona cobros" on public.invoices for all
  using (public.is_owner(client_id)) with check (public.is_owner(client_id));
create policy "cliente ve cobros" on public.invoices for select
  using (public.is_client_user(client_id) and status <> 'borrador');
create policy "creativo gestiona items cobro" on public.invoice_items for all
  using (exists (select 1 from invoices i where i.id = invoice_id and public.is_owner(i.client_id)))
  with check (exists (select 1 from invoices i where i.id = invoice_id and public.is_owner(i.client_id)));
create policy "cliente ve items cobro" on public.invoice_items for select
  using (exists (select 1 from invoices i where i.id = invoice_id and i.status <> 'borrador' and public.is_client_user(i.client_id)));

-- Chat
create policy "ver mensajes" on public.messages for select
  using (public.can_access_client(client_id));
create policy "enviar mensajes" on public.messages for insert
  with check (sender_id = auth.uid() and public.can_access_client(client_id));

-- Notificaciones
create policy "ver mis notificaciones" on public.notifications for select
  using (user_id = auth.uid());
create policy "actualizar mis notificaciones" on public.notifications for update
  using (user_id = auth.uid());

-- =====================================================================
-- TIEMPO REAL (chat y notificaciones al instante)
-- =====================================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;

-- =====================================================================
-- ARCHIVOS (imágenes de las piezas)
-- =====================================================================
insert into storage.buckets (id, name, public) values ('freelia-assets', 'freelia-assets', true)
on conflict (id) do nothing;

create policy "subir mis archivos" on storage.objects for insert to authenticated
  with check (bucket_id = 'freelia-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "borrar mis archivos" on storage.objects for delete to authenticated
  using (bucket_id = 'freelia-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "ver archivos" on storage.objects for select
  using (bucket_id = 'freelia-assets');
