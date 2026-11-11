import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCreative } from "@/lib/auth";
import { ClientChip, PageHeader, StatusBadge } from "@/components/ui";
import { ConfirmSubmit, SubmitButton } from "@/components/client-ui";
import { BriefView } from "@/components/brief-view";
import type { Brief } from "@/lib/types";
import { clientLabel } from "@/lib/utils";
import { deleteBrief, setBriefStatus } from "../../actions";

const NEXT: Record<string, { status: string; label: string } | null> = {
  nuevo: { status: "en_proceso", label: "Empezar a trabajar" },
  en_proceso: { status: "completado", label: "Marcar como completado" },
  completado: null,
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireCreative();
  const { data } = await supabase.from("briefs").select("*, clients(name, company, color)").eq("id", id).single();
  if (!data) notFound();
  const b = data as Brief;
  const next = NEXT[b.status];

  return (
    <>
      <PageHeader
        back={{ href: "/panel/briefs", label: "Briefs" }}
        title={b.title}
        subtitle={<span className="flex flex-wrap items-center gap-3 mt-1">
          <Link href={`/panel/clientes/${b.client_id}`}><ClientChip name={clientLabel(b.clients)} color={b.clients?.color} /></Link>
          <StatusBadge status={b.status} />
          {b.created_by !== user.id && <span className="badge bg-lila-t text-ink">Solicitud del cliente</span>}
        </span>}
        actions={<>
          {next && (
            <form action={setBriefStatus}>
              <input type="hidden" name="id" value={b.id} />
              <input type="hidden" name="status" value={next.status} />
              <SubmitButton>{next.label}</SubmitButton>
            </form>
          )}
          <Link href={`/panel/parrilla/nueva?cliente=${b.client_id}`} className="btn btn-soft">Crear pieza</Link>
          <Link href={`/panel/cotizaciones/nueva?cliente=${b.client_id}`} className="btn btn-soft">Cotizar</Link>
          <Link href={`/panel/briefs/${b.id}/editar`} className="btn btn-ghost">Editar</Link>
        </>}
      />
      <BriefView brief={b} />
      <form action={deleteBrief} className="mt-6">
        <input type="hidden" name="id" value={b.id} />
        <ConfirmSubmit message="¿Eliminar este brief?">Eliminar brief</ConfirmSubmit>
      </form>
    </>
  );
}
