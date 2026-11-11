import { notFound } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { PageHeader, StatusBadge } from "@/components/ui";
import { PrintButton, SubmitButton } from "@/components/client-ui";
import { QuoteDocument } from "@/components/shared";
import type { Profile, Quote } from "@/lib/types";
import { respondQuote } from "../../actions";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase } = await requireClient();
  const { data } = await supabase.from("quotes").select("*, quote_items(*), clients(name, company, email, document_id, color)").eq("id", id).single();
  if (!data) notFound();
  const q = data as Quote;
  const { data: issuer } = await supabase.from("profiles").select("*").eq("id", q.owner_id).single();

  return (
    <>
      <div className="no-print">
        <PageHeader back={{ href: "/cliente/cotizaciones", label: "Cotizaciones" }} title={`Cotización #${q.number}`}
          subtitle={<span className="inline-flex mt-1"><StatusBadge status={q.status} label={q.status === "enviada" ? "Por responder" : undefined} /></span>}
          actions={<PrintButton />} />
        {error && <p className="mb-5 rounded-xl bg-rosa text-[#b13a68] px-4 py-3 text-[13px]">{error}</p>}
        {q.status === "enviada" && (
          <div className="card p-5 mb-5 flex flex-wrap items-center gap-3 max-w-3xl">
            <p className="flex-1 min-w-[200px]">¿Estás de acuerdo con esta propuesta?</p>
            <form action={respondQuote}><input type="hidden" name="id" value={q.id} /><input type="hidden" name="accept" value="false" />
              <SubmitButton className="btn btn-ghost" pendingText="…">Rechazar</SubmitButton></form>
            <form action={respondQuote}><input type="hidden" name="id" value={q.id} /><input type="hidden" name="accept" value="true" />
              <SubmitButton pendingText="Aceptando…">✓ Aceptar cotización</SubmitButton></form>
          </div>
        )}
      </div>
      <div className="max-w-3xl"><QuoteDocument quote={q} issuer={issuer as Profile | null} client={q.clients ?? null} /></div>
    </>
  );
}
