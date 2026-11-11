import Link from "next/link";
import { requireCreative } from "@/lib/auth";
import { ClientChip, EmptyState, PageHeader, Stat, StatusBadge } from "@/components/ui";
import type { Invoice } from "@/lib/types";
import { clientLabel, fmtDate, isoToBogotaLocal, money, total } from "@/lib/utils";

export const metadata = { title: "Cuentas de cobro" };

export default async function Page() {
  const { supabase } = await requireCreative();
  const { data } = await supabase.from("invoices").select("*, invoice_items(quantity, unit_price), clients(name, company, color)").order("created_at", { ascending: false });
  const invoices = (data ?? []) as Invoice[];
  const today = isoToBogotaLocal(new Date().toISOString()).slice(0, 10);
  const isLate = (i: Invoice) => i.status === "enviada" && !!i.due_date && i.due_date < today;
  const thisMonth = today.slice(0, 7);
  const sum = (arr: Invoice[]) => arr.reduce((s, i) => s + total(i.invoice_items), 0);

  return (
    <>
      <PageHeader title="Cuentas de cobro" subtitle="Genera, envía y lleva el control de lo que te deben."
        actions={<Link href="/panel/cobros/nueva" className="btn btn-primary">+ Nueva cuenta de cobro</Link>} />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <Stat label="Por cobrar" value={money(sum(invoices.filter((i) => i.status === "enviada")))} tone="mantequilla" />
        <Stat label="Vencido" value={money(sum(invoices.filter(isLate)))} tone="rosa" />
        <Stat label="Cobrado este mes" value={money(sum(invoices.filter((i) => i.status === "pagada" && (i.paid_at ?? "").slice(0, 7) === thisMonth)))} tone="menta" />
      </div>
      {invoices.length === 0 ? <EmptyState title="Aún no tienes cuentas de cobro" /> : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>N.º</th><th>Concepto</th><th>Cliente</th><th>Vence</th><th className="text-right">Valor</th><th>Estado</th></tr></thead>
            <tbody>{invoices.map((i) => (
              <tr key={i.id}>
                <td className="text-muted">{i.number}</td>
                <td><Link href={`/panel/cobros/${i.id}`} className="font-medium hover:text-brand">{i.concept}</Link></td>
                <td><ClientChip name={clientLabel(i.clients)} color={i.clients?.color} /></td>
                <td className="text-muted whitespace-nowrap">{fmtDate(i.due_date)}</td>
                <td className="text-right font-medium whitespace-nowrap">{money(total(i.invoice_items))}</td>
                <td>{isLate(i) ? <StatusBadge status="vencida" /> : <StatusBadge status={i.status} label={i.status === "enviada" ? "Pendiente" : undefined} />}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </>
  );
}
