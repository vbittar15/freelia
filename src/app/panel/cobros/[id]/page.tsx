import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireCreative } from "@/lib/auth";
import { Notice, PageHeader, StatusBadge } from "@/components/ui";
import { ConfirmSubmit, PrintButton, SubmitButton } from "@/components/client-ui";
import { InvoiceDocument } from "@/components/documents";
import { FilePicker } from "@/components/file-picker";
import { InvoiceRemind } from "@/components/invoice-remind";
import { Icon } from "@/components/icons";
import type { Invoice } from "@/lib/types";
import { clientLabel, fmtDate, invoiceTotals, money } from "@/lib/utils";
import { deleteInvoice, setInvoiceStatus } from "../../actions";
import { confirmPayment, markPaid, registerPayment, removePayment } from "../pay-actions";

const METHODS: Record<string, string> = { transferencia: "Transferencia", nequi: "Nequi", daviplata: "Daviplata", efectivo: "Efectivo", tarjeta: "Tarjeta", otro: "Otro" };
const OK: Record<string, string> = { pago: "Pago registrado.", pagada: "Cuenta de cobro marcada como pagada.", confirmado: "Pago confirmado.", generada: "Generé la cuenta de cobro con los servicios mensuales. Revísala y envíala." };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase, profile, user } = await requireCreative();
  const { data } = await supabase.from("invoices").select("*, invoice_items(*), invoice_payments(*), clients(name, company, email, document_id, color, phone, logo_url)").eq("id", id).single();
  if (!data) notFound();
  const inv = data as Invoice;
  const t = invoiceTotals(inv);
  const pays = [...(inv.invoice_payments ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const reported = pays.filter((p) => !p.confirmed);
  const today = new Date(Date.now() - 5 * 3600000).toISOString().slice(0, 10);
  const late = inv.status === "enviada" && inv.due_date && inv.due_date < today;
  const h = await headers();
  const site = process.env.NEXT_PUBLIC_SITE_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const first = (inv.clients?.name ?? "").split(" ")[0];
  const remind = `Hola ${first}, te recuerdo la cuenta de cobro N.º ${inv.number} por ${money(t.balance)}${inv.due_date ? `, con vencimiento el ${fmtDate(inv.due_date, { day: "numeric", month: "long" })}` : ""}. Puedes verla y reportar el pago aquí: ${site}/cliente/cobros/${inv.id}`;

  const statusForm = (status: string, label: string, cls?: string) => (
    <form action={setInvoiceStatus}>
      <input type="hidden" name="id" value={inv.id} /><input type="hidden" name="status" value={status} />
      <SubmitButton className={cls}>{label}</SubmitButton>
    </form>
  );

  return (
    <>
      <div className="no-print">
        <PageHeader back={{ href: "/panel/cobros", label: "Cobros" }} title={`Cuenta de cobro N.º ${inv.number}`}
          subtitle={<span className="inline-flex flex-wrap items-center gap-2 mt-1">
            <StatusBadge status={late ? "vencida" : inv.status} label={late ? "Vencida" : inv.status === "enviada" ? (t.paid > 0 ? "Abonada" : "Pendiente de pago") : undefined} />
            <span className="text-[13px] text-muted">{clientLabel(inv.clients)}</span>
            {inv.reminded_at && <span className="text-[12px] text-muted">· recordada el {fmtDate(inv.reminded_at)}</span>}
          </span>}
          actions={<>
            {inv.status === "borrador" && statusForm("enviada", "Enviar al cliente")}
            <PrintButton />
            {inv.status === "borrador" && <Link href={`/panel/cobros/${inv.id}/editar`} className="btn btn-ghost">Editar</Link>}
          </>} />
        {sp.ok && OK[sp.ok] && <div className="mb-5"><Notice tone="ok">{OK[sp.ok]}</Notice></div>}
        {sp.error && <div className="mb-5"><Notice tone="error">{sp.error}</Notice></div>}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <InvoiceDocument invoice={inv} issuer={profile} client={inv.clients ?? null} />

        <aside className="no-print space-y-4 lg:sticky lg:top-6">
          <div className="card p-5">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><div className="text-[11px] text-muted">Total</div><div className="font-bold">{money(t.total)}</div></div>
              <div><div className="text-[11px] text-muted">Pagado</div><div className="font-bold text-[#1E8C57]">{money(t.paid)}</div></div>
              <div><div className="text-[11px] text-muted">Saldo</div><div className="font-bold">{money(t.balance)}</div></div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white overflow-hidden"><div className="h-full bg-verde transition-[width]" style={{ width: `${t.total ? Math.min(100, (t.paid / t.total) * 100) : 0}%` }} /></div>
          </div>

          {reported.map((p) => (
            <div key={p.id} className="rounded-[22px] bg-amarillo-t p-5 space-y-2">
              <div className="font-semibold flex items-center gap-2"><Icon name="bell" className="size-4" /> El cliente reportó un pago</div>
              <div className="text-[14px]">{money(p.amount)} · {METHODS[p.method] ?? p.method} · {fmtDate(p.paid_on)}{p.reference && <> · Ref. {p.reference}</>}</div>
              {p.proof_url && <a href={p.proof_url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-brand-dark inline-flex items-center gap-1"><Icon name="clip" className="size-4" /> Ver comprobante</a>}
              <div className="flex gap-2 pt-1">
                <form action={confirmPayment}><input type="hidden" name="invoice_id" value={inv.id} /><input type="hidden" name="payment_id" value={p.id} />
                  <SubmitButton className="btn btn-approve btn-sm"><Icon name="check" className="size-4" strokeWidth={2.4} /> Confirmar</SubmitButton></form>
                <form action={removePayment}><input type="hidden" name="invoice_id" value={inv.id} /><input type="hidden" name="payment_id" value={p.id} />
                  <ConfirmSubmit message="¿Rechazar este pago reportado?">Rechazar</ConfirmSubmit></form>
              </div>
            </div>
          ))}

          {inv.status === "enviada" && (
            <>
              <div className="rounded-[22px] bg-azul-t p-5 space-y-3">
                <div className="font-semibold">Cobrar</div>
                <div className="flex flex-wrap gap-2">
                  <InvoiceRemind id={inv.id} phone={inv.clients?.phone} text={remind} />
                  <form action={markPaid}><input type="hidden" name="id" value={inv.id} /><SubmitButton className="btn btn-approve btn-sm">Pagada completa</SubmitButton></form>
                </div>
              </div>
              <details className="card p-5 group">
                <summary className="cursor-pointer list-none font-semibold flex justify-between">Registrar un pago o abono <span className="text-muted group-open:rotate-180 transition-transform">⌄</span></summary>
                <form action={registerPayment} className="mt-4 grid grid-cols-2 gap-3">
                  <input type="hidden" name="invoice_id" value={inv.id} />
                  <label className="block"><span className="label">Valor</span><input name="amount" type="number" min={1} step={1000} required defaultValue={t.balance} className="input" /></label>
                  <label className="block"><span className="label">Fecha</span><input name="paid_on" type="date" defaultValue={today} className="input" /></label>
                  <label className="block"><span className="label">Medio</span><select name="method" className="input">{Object.entries(METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                  <label className="block"><span className="label">Referencia</span><input name="reference" className="input" /></label>
                  <div className="col-span-2"><span className="label">Comprobante (opcional)</span><FilePicker userId={user.id} name="proof" /></div>
                  <SubmitButton className="btn btn-primary col-span-2">Registrar pago</SubmitButton>
                </form>
              </details>
            </>
          )}

          {pays.filter((p) => p.confirmed).length > 0 && (
            <div className="card p-5">
              <div className="font-semibold mb-2">Pagos</div>
              <div className="flex flex-col gap-2">
                {pays.filter((p) => p.confirmed).map((p) => (
                  <div key={p.id} className="flex items-center gap-3 text-[13px]">
                    <span className="size-8 rounded-[10px] bg-verde-t grid place-items-center shrink-0"><Icon name="check" className="size-4" strokeWidth={2.4} /></span>
                    <div className="min-w-0 flex-1"><div className="font-semibold">{money(p.amount)}</div><div className="text-muted">{METHODS[p.method] ?? p.method} · {fmtDate(p.paid_on)}{p.reference ? ` · ${p.reference}` : ""}</div></div>
                    {p.proof_url && <a href={p.proof_url} target="_blank" rel="noopener noreferrer" aria-label="Ver comprobante" className="btn btn-ghost btn-sm !px-2"><Icon name="clip" className="size-4" /></a>}
                    <form action={removePayment}><input type="hidden" name="invoice_id" value={inv.id} /><input type="hidden" name="payment_id" value={p.id} />
                      <ConfirmSubmit message="¿Eliminar este pago?" className="btn btn-ghost btn-sm !px-2"><Icon name="trash" className="size-4" /></ConfirmSubmit></form>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form action={deleteInvoice}>
            <input type="hidden" name="id" value={inv.id} />
            <ConfirmSubmit message="¿Eliminar esta cuenta de cobro?">Eliminar cuenta de cobro</ConfirmSubmit>
          </form>
        </aside>
      </div>
    </>
  );
}
