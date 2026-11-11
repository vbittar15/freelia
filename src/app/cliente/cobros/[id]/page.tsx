import { notFound } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { PageHeader, StatusBadge } from "@/components/ui";
import { PrintButton } from "@/components/client-ui";
import { InvoiceDocument } from "@/components/shared";
import type { Invoice, Profile } from "@/lib/types";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireClient();
  const { data } = await supabase.from("invoices").select("*, invoice_items(*), clients(name, company, email, document_id, color)").eq("id", id).single();
  if (!data) notFound();
  const inv = data as Invoice;
  const { data: issuer } = await supabase.from("profiles").select("*").eq("id", inv.owner_id).single();
  return (
    <>
      <div className="no-print">
        <PageHeader back={{ href: "/cliente/cobros", label: "Cobros" }} title={`Cuenta de cobro N.º ${inv.number}`}
          subtitle={<span className="inline-flex mt-1"><StatusBadge status={inv.status} label={inv.status === "enviada" ? "Pendiente de pago" : undefined} /></span>}
          actions={<PrintButton />} />
        {inv.status === "enviada" && (
          <p className="mb-5 rounded-xl bg-cielo px-4 py-3 text-[13px] max-w-3xl">
            Cuando hagas el pago, avísale a tu equipo por <a href={`/cliente/mensajes/${inv.client_id}`} className="text-brand font-medium">mensajes</a> y adjunta el comprobante.
          </p>
        )}
      </div>
      <div className="max-w-3xl"><InvoiceDocument invoice={inv} issuer={issuer as Profile | null} client={inv.clients ?? null} /></div>
    </>
  );
}
