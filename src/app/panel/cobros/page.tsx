import Link from "next/link";
import { requireCreative } from "@/lib/auth";
import { EmptyState, PageHeader, Row, RowList, Stat, StatusBadge } from "@/components/ui";
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
      <RowList empty={<EmptyState title="Aún no tienes cuentas de cobro" action={<Link href="/panel/cobros/nueva" className="btn btn-primary">Crear cuenta de cobro</Link>} />}>
        {invoices.map((i) => {
          const st = isLate(i) ? "vencida" : i.status === "enviada" ? "pendiente" : i.status;
          return (
            <Row key={i.id} href={`/panel/cobros/${i.id}`} status={st} title={`N.º ${String(i.number).padStart(3, "0")} · ${i.concept}`}
              sub={`${clientLabel(i.clients)} · vence ${fmtDate(i.due_date)}`}
              right={money(total(i.invoice_items))} pill={<StatusBadge status={st} />} />
          );
        })}
      </RowList>
    </>
  );
}
