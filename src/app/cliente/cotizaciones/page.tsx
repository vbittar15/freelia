import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { EmptyState, PageHeader, Row, RowList, StatusBadge } from "@/components/ui";
import type { Quote } from "@/lib/types";
import { fmtDate, money, total } from "@/lib/utils";

export const metadata = { title: "Cotizaciones" };

export default async function Page() {
  const { supabase } = await requireClient();
  const { data } = await supabase.from("quotes").select("*, quote_items(quantity, unit_price)").order("created_at", { ascending: false });
  const quotes = (data ?? []) as Quote[];
  return (
    <>
      <PageHeader title="Cotizaciones" />
      {quotes.length === 0 ? <EmptyState title="No tienes cotizaciones" /> : (
        <RowList>
          {quotes.map((q) => (
            <Row key={q.id} href={`/cliente/cotizaciones/${q.id}`} status={q.status} title={q.title}
              sub={`Cotización ${String(q.number).padStart(3, "0")} · ${fmtDate(q.created_at)}`} right={money(total(q.quote_items))}
              pill={<StatusBadge status={q.status} label={q.status === "enviada" ? "Por responder" : undefined} />} />
          ))}
        </RowList>
      )}
    </>
  );
}
