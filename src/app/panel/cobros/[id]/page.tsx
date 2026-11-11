import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCreative } from "@/lib/auth";
import { PageHeader, StatusBadge } from "@/components/ui";
import { ConfirmSubmit, PrintButton, SubmitButton } from "@/components/client-ui";
import { InvoiceDocument } from "@/components/shared";
import type { Invoice } from "@/lib/types";
import { fmtDate } from "@/lib/utils";
import { deleteInvoice, setInvoiceStatus } from "../../actions";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile } = await requireCreative();
  const { data } = await supabase.from("invoices").select("*, invoice_items(*), clients(name, company, email, document_id, color)").eq("id", id).single();
  if (!data) notFound();
  const inv = data as Invoice;

  const statusForm = (status: string, label: string, cls?: string) => (
    <form action={setInvoiceStatus}>
      <input type="hidden" name="id" value={inv.id} /><input type="hidden" name="status" value={status} />
      <SubmitButton className={cls}>{label}</SubmitButton>
    </form>
  );

  return (
    <>
      <div className="no-print">
        <PageHeader
          back={{ href: "/panel/cobros", label: "Cobros" }}
          title={`Cuenta de cobro N.º ${inv.number}`}
          subtitle={<span className="inline-flex items-center gap-2 mt-1"><StatusBadge status={inv.status} label={inv.status === "enviada" ? "Pendiente de pago" : undefined} />
            {inv.paid_at && <span className="text-[12px] text-muted">Pagada el {fmtDate(inv.paid_at)}</span>}</span>}
          actions={<>
            {inv.status === "borrador" && statusForm("enviada", "Enviar al cliente")}
            {inv.status === "enviada" && statusForm("pagada", "Marcar como pagada", "btn btn-approve")}
            <PrintButton />
            {inv.status !== "pagada" && <Link href={`/panel/cobros/${inv.id}/editar`} className="btn btn-ghost">Editar</Link>}
          </>}
        />
      </div>
      <div className="max-w-3xl">
        <InvoiceDocument invoice={inv} issuer={profile} client={inv.clients ?? null} />
      </div>
      <div className="no-print mt-6 flex gap-2">
        {inv.status === "pagada" && statusForm("enviada", "Deshacer pago", "btn btn-ghost btn-sm")}
        <form action={deleteInvoice}>
          <input type="hidden" name="id" value={inv.id} />
          <ConfirmSubmit message="¿Eliminar esta cuenta de cobro?">Eliminar</ConfirmSubmit>
        </form>
      </div>
    </>
  );
}
