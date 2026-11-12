import type { Client, Invoice, LineItem, Profile, Quote } from "@/lib/types";
import { brandShades, clientLabel, fmtDate, invoiceTotals, money, numberToWords, total } from "@/lib/utils";
import { Logo } from "./brand";

export type Issuer = Pick<Profile, "full_name" | "business_name" | "document_id" | "city" | "phone" | "email" | "bank_info"> & { logo_url?: string | null; brand_color?: string | null };
export type DocClient = Pick<Client, "name" | "company" | "email" | "document_id"> & { logo_url?: string | null; phone?: string | null };

const colors = (issuer: Issuer | null) => brandShades(issuer?.brand_color || "#3D5BF5")!;
const long = (d?: string | null) => fmtDate(d, { day: "numeric", month: "long", year: "numeric" });

/** Encabezado con la marca del creativo */
export function DocHeader({ issuer, kind, number, accent }: { issuer: Issuer | null; kind: string; number: number; accent: ReturnType<typeof colors> }) {
  const brand = issuer?.business_name || issuer?.full_name || "";
  return (
    <header className="relative -mx-6 -mt-6 sm:-mx-10 sm:-mt-10 mb-8 px-6 sm:px-10 pt-7 pb-6 rounded-t-[22px] overflow-hidden" style={{ background: accent.soft }}>
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: accent.brand }} />
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {issuer?.logo_url ? <img src={issuer.logo_url} alt={brand} className="h-12 max-w-[200px] object-contain object-left" />
            : <div className="text-[22px] font-extrabold tracking-tight" style={{ color: accent.dark }}>{brand}</div>}
          <div className="mt-2 text-[12px] text-muted leading-relaxed">
            {issuer?.business_name && issuer.full_name && <div>{issuer.full_name}</div>}
            {issuer?.document_id && <div>NIT / C.C. {issuer.document_id}</div>}
            {[issuer?.phone, issuer?.email].filter(Boolean).join(" · ")}
            {issuer?.city && <div>{issuer.city}</div>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: accent.dark }}>{kind}</div>
          <div className="text-[34px] font-extrabold tracking-tight leading-none mt-1">N.º {String(number).padStart(3, "0")}</div>
        </div>
      </div>
    </header>
  );
}

function Meta({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[13px]">
      {items.map(([l, v]) => <div key={l}><div className="text-[10.5px] uppercase tracking-wide text-muted mb-0.5">{l}</div><div className="font-semibold">{v}</div></div>)}
    </div>
  );
}

function Party({ client, label }: { client: DocClient | null; label: string }) {
  return (
    <div className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {client?.logo_url && <img src={client.logo_url} alt="" className="size-12 rounded-[12px] object-contain bg-white ring-1 ring-line" />}
      <div className="text-[13px]">
        <div className="text-[10.5px] uppercase tracking-wide text-muted mb-0.5">{label}</div>
        <div className="font-bold text-[15px]">{clientLabel(client)}</div>
        <div className="text-muted">{[client?.company ? client.name : null, client?.document_id ? `NIT / C.C. ${client.document_id}` : null].filter(Boolean).join(" · ")}</div>
      </div>
    </div>
  );
}

export function ItemsTable({ items, accent }: { items: LineItem[]; accent: ReturnType<typeof colors> }) {
  return (
    <table className="w-full text-left text-[13px] mt-7 border-separate border-spacing-0">
      <thead>
        <tr className="text-[10.5px] uppercase tracking-wide" style={{ color: accent.dark }}>
          <th className="py-2.5 px-3 font-semibold rounded-l-[10px]" style={{ background: accent.tint }}>Descripción</th>
          <th className="py-2.5 px-3 font-semibold text-right w-16 hidden sm:table-cell" style={{ background: accent.tint }}>Cant.</th>
          <th className="py-2.5 px-3 font-semibold text-right w-32 hidden sm:table-cell" style={{ background: accent.tint }}>Valor unit.</th>
          <th className="py-2.5 px-3 font-semibold text-right w-32 rounded-r-[10px]" style={{ background: accent.tint }}>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        {[...items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((i, idx) => (
          <tr key={i.id ?? idx}>
            <td className="py-3 px-3 border-b border-line">
              {i.description}
              <div className="sm:hidden text-[12px] text-muted">{Number(i.quantity)} × {money(i.unit_price)}</div>
            </td>
            <td className="py-3 px-3 border-b border-line text-right hidden sm:table-cell">{Number(i.quantity)}</td>
            <td className="py-3 px-3 border-b border-line text-right hidden sm:table-cell">{money(i.unit_price)}</td>
            <td className="py-3 px-3 border-b border-line text-right font-semibold">{money(Number(i.quantity) * Number(i.unit_price))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Totals({ rows, total: t, accent, label = "Total a pagar" }: { rows: [string, number, boolean?][]; total: number; accent: ReturnType<typeof colors>; label?: string }) {
  return (
    <div className="flex justify-end mt-5 break-inside-avoid">
      <div className="w-full sm:w-80 text-[13px]">
        {rows.filter(([, v, always]) => always || v).map(([l, v]) => (
          <div key={l} className="flex justify-between py-1.5 px-1"><span className="text-muted">{l}</span><span className="font-semibold">{v < 0 ? `− ${money(-v)}` : money(v)}</span></div>
        ))}
        <div className="mt-2 flex items-center justify-between rounded-[14px] px-4 py-3 text-white" style={{ background: accent.brand }}>
          <span className="text-[12px] font-semibold uppercase tracking-wide">{label}</span>
          <span className="text-[22px] font-extrabold tracking-tight">{money(t)}</span>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="mt-10 pt-4 border-t border-line flex items-center justify-between text-[11px] text-faint">
      <span>Documento generado con</span><Logo size={13} />
    </div>
  );
}

export function QuoteDocument({ quote, issuer, client }: { quote: Quote; issuer: Issuer | null; client: DocClient | null }) {
  const a = colors(issuer);
  const items = quote.quote_items ?? [];
  return (
    <article className="sheet doc p-6 sm:p-10">
      <DocHeader issuer={issuer} kind="Cotización" number={quote.number} accent={a} />
      <div className="flex flex-wrap items-end justify-between gap-6">
        <Party client={client} label="Para" />
        <Meta items={[["Fecha", long(quote.created_at)], ["Válida hasta", long(quote.valid_until)]]} />
      </div>
      <h2 className="mt-7 text-[18px] font-bold">{quote.title}</h2>
      <ItemsTable items={items} accent={a} />
      <Totals rows={[]} total={total(items)} accent={a} label="Total" />
      {quote.notes && (
        <div className="mt-8 rounded-[16px] p-4 text-[13px] whitespace-pre-wrap leading-relaxed break-inside-avoid" style={{ background: a.soft }}>
          <div className="text-[10.5px] uppercase tracking-wide text-muted mb-1">Condiciones</div>{quote.notes}
        </div>
      )}
      <Footer />
    </article>
  );
}

export function InvoiceDocument({ invoice, issuer, client }: { invoice: Invoice; issuer: Issuer | null; client: DocClient | null }) {
  const a = colors(issuer);
  const items = invoice.invoice_items ?? [];
  const t = invoiceTotals(invoice);
  const paid = invoice.status === "pagada";
  return (
    <article className="sheet doc p-6 sm:p-10 relative">
      {paid && <div className="absolute right-8 top-40 -rotate-12 rounded-[12px] border-[3px] px-4 py-1 text-[22px] font-extrabold tracking-widest text-[#1E8C57] border-[#1E8C57] opacity-80 pointer-events-none">PAGADA</div>}
      <DocHeader issuer={issuer} kind="Cuenta de cobro" number={invoice.number} accent={a} />
      <div className="flex flex-wrap items-end justify-between gap-6">
        <Party client={client} label="Cliente" />
        <Meta items={[["Fecha", long(invoice.issue_date)], ["Vence", invoice.due_date ? long(invoice.due_date) : "—"]]} />
      </div>

      <div className="mt-8 rounded-[16px] ring-1 ring-line p-5 text-center">
        <div className="text-[11px] tracking-[0.3em] text-muted">{clientLabel(client).toUpperCase()} DEBE A</div>
        <div className="mt-1.5 text-[17px] font-bold">{issuer?.full_name}</div>
        {issuer?.document_id && <div className="text-[13px] text-muted">C.C. / NIT {issuer.document_id}</div>}
        <div className="mt-3 text-[13px]">la suma de <b>{money(t.total)}</b> <span className="text-muted">({numberToWords(t.total)} pesos m/cte)</span></div>
        <div className="text-[13px]">por concepto de <b>{invoice.concept}</b></div>
      </div>

      <ItemsTable items={items} accent={a} />
      <Totals accent={a} total={t.total} rows={[
        ["Subtotal", t.subtotal, true], ["Descuento", -t.discount], [`IVA (${Number(invoice.tax_rate ?? 0)}%)`, t.tax], [`Retención (${Number(invoice.withholding_rate ?? 0)}%)`, -t.withholding],
      ]} />
      {t.paid > 0 && !paid && (
        <div className="flex justify-end"><div className="w-full sm:w-80 mt-2 text-[13px] px-1">
          <div className="flex justify-between py-1"><span className="text-muted">Abonado</span><span className="font-semibold">{money(t.paid)}</span></div>
          <div className="flex justify-between py-1"><span className="font-semibold">Saldo pendiente</span><span className="font-extrabold">{money(t.balance)}</span></div>
        </div></div>
      )}

      {(issuer?.bank_info || invoice.notes) && (
        <div className="mt-8 grid sm:grid-cols-2 gap-4 text-[13px] break-inside-avoid">
          {issuer?.bank_info && (
            <div className="rounded-[16px] p-4 whitespace-pre-wrap leading-relaxed" style={{ background: a.soft }}>
              <div className="text-[10.5px] uppercase tracking-wide mb-1 font-semibold" style={{ color: a.dark }}>Datos para el pago</div>{issuer.bank_info}
            </div>
          )}
          {invoice.notes && (
            <div className="rounded-[16px] bg-surface p-4 whitespace-pre-wrap leading-relaxed">
              <div className="text-[10.5px] uppercase tracking-wide text-muted mb-1">Notas</div>{invoice.notes}
            </div>
          )}
        </div>
      )}

      <div className="mt-14 w-64 break-inside-avoid">
        <div className="border-t-2 pt-2" style={{ borderColor: a.dark }}>
          <div className="font-bold">{issuer?.full_name}</div>
          {issuer?.document_id && <div className="text-[12px] text-muted">C.C. / NIT {issuer.document_id}</div>}
        </div>
      </div>
      <Footer />
    </article>
  );
}
