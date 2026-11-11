import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
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
        <div className="card divide-y divide-line">
          {quotes.map((q) => (
            <Link key={q.id} href={`/cliente/cotizaciones/${q.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-surface/60">
              <div className="flex-1 min-w-0"><div className="font-medium truncate">#{q.number} · {q.title}</div>
                <div className="text-[12px] text-muted">{fmtDate(q.created_at)}</div></div>
              <div className="font-medium">{money(total(q.quote_items))}</div>
              <StatusBadge status={q.status} label={q.status === "enviada" ? "Por responder" : undefined} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
