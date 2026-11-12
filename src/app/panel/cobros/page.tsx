import Link from "next/link";
import { requireCreative } from "@/lib/auth";
import { EmptyState, PageHeader, Row, RowList, Stat, StatusBadge } from "@/components/ui";
import type { Invoice } from "@/lib/types";
import { clientLabel, fmtDate, invoiceTotals, isoToBogotaLocal, money } from "@/lib/utils";

export const metadata = { title: "Cuentas de cobro" };

export default async function Page() {
  const { supabase } = await requireCreative();
  const { data } = await supabase.from("invoices").select("*, invoice_items(quantity, unit_price), invoice_payments(amount, confirmed, paid_on), clients(name, company, color)").order("created_at", { ascending: false });
  const invoices = (data ?? []) as Invoice[];
  const today = isoToBogotaLocal(new Date().toISOString()).slice(0, 10);
  const isLate = (i: Invoice) => i.status === "enviada" && !!i.due_date && i.due_date < today;
  const thisMonth = today.slice(0, 7);
  const sum = (arr: Invoice[], k: "total" | "balance" = "total") => arr.reduce((s, i) => s + invoiceTotals(i)[k], 0);
  const paidThisMonth = invoices.reduce((s, i) => s + ((i.invoice_payments ?? []) as { amount: number; confirmed: boolean; paid_on?: string }[])
    .filter((p) => p.confirmed && (p.paid_on ?? "").slice(0, 7) === thisMonth).reduce((a, p) => a + Number(p.amount), 0), 0);
  const reported = invoices.filter((i) => (i.invoice_payments ?? []).some((p) => !p.confirmed));

  return (
    <>
      <PageHeader title="Cuentas de cobro" subtitle="Genera, envía y lleva el control de lo que te deben."
        actions={<Link href="/panel/cobros/nueva" className="btn btn-primary">+ Nueva cuenta de cobro</Link>} />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <Stat label="Por cobrar" value={money(sum(invoices.filter((i) => i.status === "enviada"), "balance"))} tone="mantequilla" />
        <Stat label="Vencido" value={money(sum(invoices.filter(isLate), "balance"))} tone="rosa" />
        <Stat label="Cobrado este mes" value={money(paidThisMonth)} tone="menta" />
      </div>
      {reported.length > 0 && (
        <Link href={`/panel/cobros/${reported[0].id}`} className="mb-6 flex items-center gap-3 rounded-[20px] bg-amarillo-t px-4 py-3.5 hover:ring-2 hover:ring-amarillo transition">
          <span className="font-semibold flex-1">{reported.length === 1 ? "Un cliente reportó un pago" : `${reported.length} clientes reportaron pagos`}. Confírmalo.</span>
          <span className="btn btn-sm bg-white text-ink">Revisar</span>
        </Link>
      )}
      <RowList empty={<EmptyState title="Aún no tienes cuentas de cobro" action={<Link href="/panel/cobros/nueva" className="btn btn-primary">Crear cuenta de cobro</Link>} />}>
        {invoices.map((i) => {
          const t = invoiceTotals(i);
          const st = isLate(i) ? "vencida" : i.status === "enviada" ? "pendiente" : i.status;
          return (
            <Row key={i.id} href={`/panel/cobros/${i.id}`} status={st} title={`N.º ${String(i.number).padStart(3, "0")} · ${i.concept}`}
              sub={`${clientLabel(i.clients)} · vence ${fmtDate(i.due_date)}`}
              right={<span className="text-right"><span className="block">{money(t.total)}</span>{i.status === "enviada" && t.paid > 0 && <span className="block text-[11px] text-muted font-normal">Saldo {money(t.balance)}</span>}</span>}
              pill={<StatusBadge status={st} label={i.status === "enviada" && t.paid > 0 && !isLate(i) ? "Abonada" : undefined} />} />
          );
        })}
      </RowList>
    </>
  );
}
