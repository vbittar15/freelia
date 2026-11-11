import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCreative } from "@/lib/auth";
import { PageHeader, StatusBadge } from "@/components/ui";
import { ConfirmSubmit, PrintButton, SubmitButton } from "@/components/client-ui";
import { QuoteDocument } from "@/components/shared";
import type { Quote } from "@/lib/types";
import { ErrorNote } from "../../_forms";
import { deleteQuote, quoteToInvoice, setQuoteStatus } from "../../actions";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase, profile } = await requireCreative();
  const { data } = await supabase.from("quotes").select("*, quote_items(*), clients(name, company, email, document_id, color)").eq("id", id).single();
  if (!data) notFound();
  const q = data as Quote;

  return (
    <>
      <div className="no-print">
        <PageHeader
          back={{ href: "/panel/cotizaciones", label: "Cotizaciones" }}
          title={`Cotización #${q.number}`}
          subtitle={<span className="inline-flex mt-1"><StatusBadge status={q.status} /></span>}
          actions={<>
            {q.status === "borrador" && (
              <form action={setQuoteStatus}>
                <input type="hidden" name="id" value={q.id} /><input type="hidden" name="status" value="enviada" />
                <SubmitButton pendingText="Enviando…">Enviar al cliente</SubmitButton>
              </form>
            )}
            {q.status === "aceptada" && (
              <form action={quoteToInvoice}>
                <input type="hidden" name="id" value={q.id} />
                <SubmitButton pendingText="Creando…">Crear cuenta de cobro</SubmitButton>
              </form>
            )}
            <PrintButton />
            {q.status !== "aceptada" && <Link href={`/panel/cotizaciones/${q.id}/editar`} className="btn btn-ghost">Editar</Link>}
          </>}
        />
        <ErrorNote error={error} />
        {q.status === "enviada" && (
          <p className="mb-5 rounded-[18px] bg-azul-t px-4 py-3 text-[14px]">Esperando respuesta del cliente. Te avisaremos cuando la acepte o la rechace.</p>
        )}
      </div>
      <div className="max-w-3xl">
        <QuoteDocument quote={q} issuer={profile} client={q.clients ?? null} />
      </div>
      <div className="no-print mt-6 flex gap-2">
        {q.status === "rechazada" && (
          <form action={setQuoteStatus}>
            <input type="hidden" name="id" value={q.id} /><input type="hidden" name="status" value="borrador" />
            <SubmitButton className="btn btn-soft btn-sm">Volver a borrador</SubmitButton>
          </form>
        )}
        <form action={deleteQuote}>
          <input type="hidden" name="id" value={q.id} />
          <ConfirmSubmit message="¿Eliminar esta cotización?">Eliminar</ConfirmSubmit>
        </form>
      </div>
    </>
  );
}
