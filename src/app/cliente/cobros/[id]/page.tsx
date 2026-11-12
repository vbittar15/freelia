import { notFound } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { Notice, PageHeader, StatusBadge } from "@/components/ui";
import { PrintButton, SubmitButton } from "@/components/client-ui";
import { InvoiceDocument } from "@/components/documents";
import { FilePicker } from "@/components/file-picker";
import { Icon } from "@/components/icons";
import type { Invoice, Profile } from "@/lib/types";
import { fmtDate, invoiceTotals, money } from "@/lib/utils";
import { reportPayment } from "../../actions";

const METHODS: Record<string, string> = { transferencia: "Transferencia", nequi: "Nequi", daviplata: "Daviplata", efectivo: "Efectivo", tarjeta: "Tarjeta", otro: "Otro" };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase, user } = await requireClient();
  const { data } = await supabase.from("invoices").select("*, invoice_items(*), invoice_payments(*), clients(name, company, email, document_id, color, logo_url)").eq("id", id).single();
  if (!data) notFound();
  const inv = data as Invoice;
  const { data: issuer } = await supabase.from("profiles").select("*").eq("id", inv.owner_id).single();
  const t = invoiceTotals(inv);
  const pays = [...(inv.invoice_payments ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const today = new Date(Date.now() - 5 * 3600000).toISOString().slice(0, 10);
  return (
    <>
      <div className="no-print">
        <PageHeader back={{ href: "/cliente/cobros", label: "Cobros" }} title={`Cuenta de cobro N.º ${inv.number}`}
          subtitle={<span className="inline-flex mt-1"><StatusBadge status={inv.status} label={inv.status === "enviada" ? (t.paid > 0 ? "Abonada" : "Pendiente de pago") : undefined} /></span>}
          actions={<PrintButton />} />
        {sp.ok && <div className="mb-5"><Notice tone="ok">¡Gracias! Avisamos a tu equipo creativo para que confirme tu pago.</Notice></div>}
        {sp.error && <div className="mb-5"><Notice tone="error">{sp.error}</Notice></div>}
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <InvoiceDocument invoice={inv} issuer={issuer as Profile | null} client={inv.clients ?? null} />
        <aside className="no-print space-y-4 lg:sticky lg:top-6">
          <div className="card p-5">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div><div className="text-[11px] text-muted">Total</div><div className="font-bold">{money(t.total)}</div></div>
              <div><div className="text-[11px] text-muted">Saldo</div><div className="font-bold">{money(t.balance)}</div></div>
            </div>
            {inv.due_date && inv.status === "enviada" && <p className="text-[12px] text-muted text-center mt-2">Fecha límite: {fmtDate(inv.due_date, { day: "numeric", month: "long" })}</p>}
          </div>

          {inv.status === "enviada" && (
            <details className="card p-5 group" open>
              <summary className="cursor-pointer list-none font-semibold flex justify-between">Ya pagué <span className="text-muted group-open:rotate-180 transition-transform">⌄</span></summary>
              <p className="text-[13px] text-muted mt-1">Cuéntanos cómo pagaste y adjunta el comprobante.</p>
              <form action={reportPayment} className="mt-3 grid grid-cols-2 gap-3">
                <input type="hidden" name="invoice_id" value={inv.id} />
                <label className="block"><span className="label">Valor</span><input name="amount" type="number" min={1} step={1000} required defaultValue={t.balance - t.reported > 0 ? t.balance - t.reported : t.balance} className="input" /></label>
                <label className="block"><span className="label">Fecha</span><input name="paid_on" type="date" defaultValue={today} className="input" /></label>
                <label className="block"><span className="label">Medio</span><select name="method" className="input">{Object.entries(METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                <label className="block"><span className="label">Referencia</span><input name="reference" className="input" placeholder="Opcional" /></label>
                <div className="col-span-2"><span className="label">Comprobante</span><FilePicker userId={user.id} name="proof" /></div>
                <SubmitButton className="btn btn-primary col-span-2" pendingText="Enviando…">Reportar pago</SubmitButton>
              </form>
            </details>
          )}

          {pays.length > 0 && (
            <div className="card p-5">
              <div className="font-semibold mb-2">Pagos</div>
              {pays.map((p) => (
                <div key={p.id} className="flex items-center gap-3 text-[13px] py-1.5">
                  <span className={`size-8 rounded-[10px] grid place-items-center shrink-0 ${p.confirmed ? "bg-verde-t" : "bg-amarillo-t"}`}><Icon name={p.confirmed ? "check" : "bell"} className="size-4" /></span>
                  <div className="min-w-0 flex-1"><div className="font-semibold">{money(p.amount)}</div><div className="text-muted">{METHODS[p.method] ?? p.method} · {fmtDate(p.paid_on)} · {p.confirmed ? "Confirmado" : "Por confirmar"}</div></div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
