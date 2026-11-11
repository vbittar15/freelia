import Link from "next/link";
import { requireCreative } from "@/lib/auth";
import { ClientChip, EmptyState, PageHeader, Stat, StatusBadge } from "@/components/ui";
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
      {quotes.length === 0 ? <EmptyState title="Aún no tienes cotizaciones" /> : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>#</th><th>Título</th><th>Cliente</th><th>Fecha</th><th className="text-right">Total</th><th>Estado</th></tr></thead>
            <tbody>{quotes.map((q) => (
              <tr key={q.id}>
                <td className="text-muted">{q.number}</td>
                <td><Link href={`/panel/cotizaciones/${q.id}`} className="font-medium hover:text-brand">{q.title}</Link></td>
                <td><ClientChip name={clientLabel(q.clients)} color={q.clients?.color} /></td>
                <td className="text-muted whitespace-nowrap">{fmtDate(q.created_at)}</td>
                <td className="text-right font-medium whitespace-nowrap">{money(total(q.quote_items))}</td>
                <td><StatusBadge status={q.status} /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </>
  );
}
