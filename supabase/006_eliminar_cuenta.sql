-- =====================================================================
-- FREELIA · 006 Eliminar cuenta (creativo/marca y cliente)
--   · creativo: se borran sus clientes, parrilla, cotizaciones, cobros, chats…
--   · cliente: se desvincula; el creativo conserva la ficha y el historial
-- =====================================================================

-- El historial del cliente (briefs que pidió, comentarios, mensajes) no debe bloquear el borrado
alter table public.briefs alter column created_by drop not null;
alter table public.briefs drop constraint if exists briefs_created_by_fkey;
alter table public.briefs add constraint briefs_created_by_fkey foreign key (created_by) references public.profiles(id) on delete set null;

alter table public.post_comments alter column author_id drop not null;
alter table public.post_comments drop constraint if exists post_comments_author_id_fkey;
alter table public.post_comments add constraint post_comments_author_id_fkey foreign key (author_id) references public.profiles(id) on delete set null;

alter table public.messages alter column sender_id drop not null;
alter table public.messages drop constraint if exists messages_sender_id_fkey;
alter table public.messages add constraint messages_sender_id_fkey foreign key (sender_id) references public.profiles(id) on delete set null;

-- Borra la cuenta del usuario que llama (y en cascada todo lo que le pertenece)
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'No has iniciado sesión'; end if;
  delete from auth.users where id = v_uid;
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
