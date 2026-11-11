import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import type { Invoice } from "@/lib/types";
import { fmtDate, money, total } from "@/lib/utils";

export const metadata = { title: "Cuentas de cobro" };

export default async function Page() {
  const { supabase } = await requireClient();
  const { data } = await supabase.from("invoices").select("*, invoice_items(quantity, unit_price)").order("created_at", { ascending: false });
  const invoices = (data ?? []) as Invoice[];
  return (
    <>
      <PageHeader title="Cuentas de cobro" />
      {invoices.length === 0 ? <EmptyState title="No tienes cuentas de cobro" /> : (
        <div className="card divide-y divide-line">
          {invoices.map((i) => (
            <Link key={i.id} href={`/cliente/cobros/${i.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-surface/60">
              <div className="flex-1 min-w-0"><div className="font-medium truncate">N.º {i.number} · {i.concept}</div>
                <div className="text-[12px] text-muted">Vence {fmtDate(i.due_date)}</div></div>
              <div className="font-medium">{money(total(i.invoice_items))}</div>
              <StatusBadge status={i.status} label={i.status === "enviada" ? "Pendiente" : undefined} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
