import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { EmptyState, PageHeader, Row, RowList, StatusBadge } from "@/components/ui";
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
        <RowList>
          {invoices.map((i) => {
            const st = i.status === "enviada" ? "pendiente" : i.status;
            return (
              <Row key={i.id} href={`/cliente/cobros/${i.id}`} status={st} title={`N.º ${String(i.number).padStart(3, "0")} · ${i.concept}`}
                sub={`Vence ${fmtDate(i.due_date)}`} right={money(total(i.invoice_items))} pill={<StatusBadge status={st} />} />
            );
          })}
        </RowList>
      )}
    </>
  );
}
