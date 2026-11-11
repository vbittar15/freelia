import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCreative } from "@/lib/auth";
import { ClientChip, PageHeader, StatusBadge } from "@/components/ui";
import { ConfirmSubmit, SubmitButton } from "@/components/client-ui";
import { CommentThread } from "@/components/shared";
import type { Post, PostComment } from "@/lib/types";
import { clientLabel } from "@/lib/utils";
import { ErrorNote, PostForm } from "../../_forms";
import { deletePost, setPostStatus } from "../../actions";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; ok?: string }> }) {
  const { id } = await params;
  const { error, ok } = await searchParams;
  const { supabase, user } = await requireCreative();
  const [{ data }, { data: comments }, { data: clients }] = await Promise.all([
    supabase.from("posts").select("*, clients(name, company, color, client_user_id)").eq("id", id).single(),
    supabase.from("post_comments").select("*, profiles(full_name)").eq("post_id", id).order("created_at"),
    supabase.from("clients").select("id, name, company"),
  ]);
  if (!data) notFound();
  const p = data as Post & { clients: { client_user_id: string | null } };

  return (
    <>
      <PageHeader
        back={{ href: "/panel/parrilla", label: "Parrilla" }}
        title={p.title}
        subtitle={<span className="flex flex-wrap items-center gap-3 mt-1">
          <Link href={`/panel/clientes/${p.client_id}`}><ClientChip name={clientLabel(p.clients)} color={p.clients?.color} /></Link>
          <StatusBadge status={p.status} />
        </span>}
        actions={<>
          {p.status === "aprobado" && (
            <form action={setPostStatus}>
              <input type="hidden" name="id" value={p.id} /><input type="hidden" name="status" value="publicado" />
              <SubmitButton>Marcar como publicado</SubmitButton>
            </form>
          )}
          {p.status === "en_revision" && (
            <form action={setPostStatus}>
              <input type="hidden" name="id" value={p.id} /><input type="hidden" name="status" value="borrador" />
              <SubmitButton className="btn btn-ghost">Retirar de revisión</SubmitButton>
            </form>
          )}
        </>}
      />
      <ErrorNote error={error} />
      {ok && p.status === "en_revision" && (
        <p className="mb-5 rounded-xl bg-menta text-[#2c7a57] px-4 py-3 text-[13px]">
          {p.clients?.client_user_id
            ? "Enviada a aprobación. Tu cliente ya recibió la notificación."
            : "Guardada en revisión. Tu cliente aún no tiene cuenta: invítalo desde su ficha para que pueda aprobar."}
        </p>
      )}
      {ok && p.status !== "en_revision" && <p className="mb-5 rounded-xl bg-menta text-[#2c7a57] px-4 py-3 text-[13px]">Cambios guardados.</p>}

      <PostForm post={p} clients={clients ?? []} userId={user.id} />

      <div className="mt-8 grid lg:grid-cols-[1fr_340px] gap-5">
        <CommentThread comments={(comments ?? []) as PostComment[]} postId={p.id} path={`/panel/parrilla/${p.id}`} userId={user.id} />
        <form action={deletePost}>
          <input type="hidden" name="id" value={p.id} />
          <ConfirmSubmit message="¿Eliminar esta pieza y sus comentarios?">Eliminar pieza</ConfirmSubmit>
        </form>
      </div>
    </>
  );
}
