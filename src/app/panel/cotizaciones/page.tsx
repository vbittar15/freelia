import Link from "next/link";
import { requireCreative } from "@/lib/auth";
import { EmptyState, PageHeader, Row, RowList, Stat, StatusBadge } from "@/components/ui";
import type { Quote } from "@/lib/types";
import { clientLabel, fmtDate, money, total } from "@/lib/utils";

export const metadata = { title: "Cotizaciones" };

export default async function Page() {
  const { supabase } = await requireCreative();
  const { data } = await supabase.from("quotes").select("*, quote_items(quantity, unit_price), clients(name, company, color)").order("created_at", { ascending: false });
  const quotes = (data ?? []) as Quote[];
  const sum = (st: string) => quotes.filter((q) => q.status === st).reduce((s, q) => s + total(q.quote_items), 0);

  return (
    <>
      <PageHeader title="Cotizaciones" subtitle="Tu cliente las recibe y las acepta en línea."
        actions={<Link href="/panel/cotizaciones/nueva" className="btn btn-primary">+ Nueva cotización</Link>} />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <Stat label="Enviadas (por responder)" value={money(sum("enviada"))} tone="cielo" />
        <Stat label="Aceptadas" value={money(sum("aceptada"))} tone="menta" />
        <Stat label="Borradores" value={quotes.filter((q) => q.status === "borrador").length} tone="lavanda" />
      </div>
      <RowList empty={<EmptyState title="Aún no tienes cotizaciones" action={<Link href="/panel/cotizaciones/nueva" className="btn btn-primary">Crear cotización</Link>} />}>
        {quotes.map((q) => (
          <Row key={q.id} href={`/panel/cotizaciones/${q.id}`} status={q.status} title={q.title}
            sub={`${String(q.number).padStart(3, "0")} · ${clientLabel(q.clients)} · ${fmtDate(q.created_at)}`}
            right={money(total(q.quote_items))} pill={<StatusBadge status={q.status} />} />
        ))}
      </RowList>
    </>
  );
}
