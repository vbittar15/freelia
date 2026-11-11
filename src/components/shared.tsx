import Link from "next/link";
import { addComment, markAllRead } from "@/app/shared-actions";
import type { Client, Invoice, LineItem, Notification, PostComment, Profile, Quote } from "@/lib/types";
import { clientLabel, cn, fmtDate, fmtDateTime, money, numberToWords, timeAgo, total } from "@/lib/utils";
import { SubmitButton } from "./client-ui";
import { Avatar, EmptyState } from "./ui";
import { Logo } from "./brand";

// ------------------------------------------------------------ Comentarios de una pieza
export function CommentThread({
  comments, postId, path, userId,
}: { comments: PostComment[]; postId: string; path: string; userId: string }) {
  const label = { comentario: "", aprobado: "aprobó la pieza", cambios: "pidió cambios" };
  return (
    <div className="card p-5">
      <h3 className="font-medium mb-4">Conversación de la pieza</h3>
      <div className="space-y-4">
        {comments.length === 0 && <p className="text-muted text-[13px]">Sin comentarios todavía.</p>}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Avatar name={c.profiles?.full_name} size={28} color={c.author_id === userId ? "var(--color-cielo)" : undefined} />
            <div className="min-w-0">
              <div className="text-[12px]">
                <span className="font-medium">{c.author_id === userId ? "Tú" : c.profiles?.full_name ?? "Usuario"}</span>
                {c.action !== "comentario" && (
                  <span className={cn("ml-1.5 badge", c.action === "aprobado" ? "bg-menta text-[#2c7a57]" : "bg-rosa text-[#b13a68]")}>
                    {label[c.action]}
                  </span>
                )}
                <span className="text-muted ml-2">{timeAgo(c.created_at)}</span>
              </div>
              {c.body && <p className="mt-1 whitespace-pre-wrap leading-relaxed">{c.body}</p>}
            </div>
          </div>
        ))}
      </div>
      <form action={addComment} className="mt-5 flex gap-2">
        <input type="hidden" name="post_id" value={postId} />
        <input type="hidden" name="path" value={path} />
        <input name="body" className="input" placeholder="Escribe un comentario…" required />
        <SubmitButton className="btn btn-soft" pendingText="…">Comentar</SubmitButton>
      </form>
    </div>
  );
}

// ------------------------------------------------------------ Lista de notificaciones
export function NotificationList({ items, path }: { items: Notification[]; path: string }) {
  const unread = items.some((n) => !n.read_at);
  if (items.length === 0) return <EmptyState title="Todo en calma" text="Aquí verás aprobaciones, mensajes y movimientos de tus clientes." />;
  return (
    <div>
      {unread && (
        <form action={markAllRead} className="mb-4 flex justify-end">
          <input type="hidden" name="path" value={path} />
          <SubmitButton className="btn btn-ghost btn-sm" pendingText="…">Marcar todas como leídas</SubmitButton>
        </form>
      )}
      <div className="card divide-y divide-line">
        {items.map((n) => (
          <Link key={n.id} href={n.link ?? "#"} className="flex items-start gap-3 px-5 py-4 hover:bg-surface/60">
            <span className={cn("mt-1.5 size-2 rounded-full shrink-0", n.read_at ? "bg-line" : "bg-brand")} />
            <div className="min-w-0 flex-1">
              <div className={cn(!n.read_at && "font-medium")}>{n.title}</div>
              {n.body && <div className="text-muted text-[13px] truncate">{n.body}</div>}
            </div>
            <span className="text-[11px] text-muted shrink-0">{timeAgo(n.created_at)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------ Documentos imprimibles
function ItemsTable({ items }: { items: LineItem[] }) {
  return (
    <table className="w-full text-left mt-6">
      <thead>
        <tr className="text-[11px] uppercase tracking-wide text-muted border-b border-line">
          <th className="py-2 font-medium">Descripción</th>
          <th className="py-2 font-medium text-right w-16 hidden sm:table-cell">Cant.</th>
          <th className="py-2 font-medium text-right w-32 hidden sm:table-cell">Valor unit.</th>
          <th className="py-2 font-medium text-right w-32">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        {[...items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((i, idx) => (
          <tr key={i.id ?? idx} className="border-b border-line">
            <td className="py-3 pr-4">
              {i.description}
              <div className="sm:hidden text-[12px] text-muted">{Number(i.quantity)} × {money(i.unit_price)}</div>
            </td>
            <td className="py-3 text-right hidden sm:table-cell">{Number(i.quantity)}</td>
            <td className="py-3 text-right hidden sm:table-cell">{money(i.unit_price)}</td>
            <td className="py-3 text-right font-medium">{money(Number(i.quantity) * Number(i.unit_price))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type Issuer = Pick<Profile, "full_name" | "business_name" | "document_id" | "city" | "phone" | "email" | "bank_info">;
type DocClient = Pick<Client, "name" | "company" | "email" | "document_id">;

export function QuoteDocument({ quote, issuer, client }: { quote: Quote; issuer: Issuer | null; client: DocClient | null }) {
  const items = quote.quote_items ?? [];
  return (
    <div className="card print-sheet p-6 sm:p-10">
      <div className="flex flex-wrap justify-between gap-6">
        <div>
          <div className="text-[12px] text-muted">Cotización</div>
          <div className="text-[28px] font-semibold tracking-tight">#{String(quote.number).padStart(3, "0")}</div>
          <div className="mt-1 font-medium">{quote.title}</div>
        </div>
        <div className="sm:text-right text-[13px]">
          <div className="font-medium">{issuer?.business_name || issuer?.full_name}</div>
          {issuer?.document_id && <div className="text-muted">NIT / C.C. {issuer.document_id}</div>}
          {issuer?.email && <div className="text-muted">{issuer.email}</div>}
          {issuer?.phone && <div className="text-muted">{issuer.phone}</div>}
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mt-8 text-[13px]">
        <div><div className="text-muted text-[11px]">Para</div><div className="font-medium">{clientLabel(client)}</div>{client?.company && <div className="text-muted">{client.name}</div>}</div>
        <div><div className="text-muted text-[11px]">Fecha</div><div>{fmtDate(quote.created_at)}</div></div>
        <div><div className="text-muted text-[11px]">Válida hasta</div><div>{fmtDate(quote.valid_until)}</div></div>
      </div>
      <ItemsTable items={items} />
      <div className="flex justify-end mt-5">
        <div className="text-right">
          <div className="text-[11px] text-muted">Total</div>
          <div className="text-[26px] font-semibold tracking-tight">{money(total(items))}</div>
        </div>
      </div>
      {quote.notes && (
        <div className="mt-8 rounded-xl bg-surface p-4 text-[13px] whitespace-pre-wrap leading-relaxed">
          <div className="text-[11px] text-muted mb-1">Condiciones</div>{quote.notes}
        </div>
      )}
      <div className="mt-10 flex items-center justify-between text-[11px] text-muted">
        <span>Generado con</span><Logo size={14} />
      </div>
    </div>
  );
}

export function InvoiceDocument({ invoice, issuer, client }: { invoice: Invoice; issuer: Issuer | null; client: DocClient | null }) {
  const items = invoice.invoice_items ?? [];
  const sum = total(items);
  return (
    <div className="card print-sheet p-6 sm:p-10 text-[13px]">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <div className="text-[12px] text-muted">Cuenta de cobro</div>
          <div className="text-[28px] font-semibold tracking-tight">N.º {String(invoice.number).padStart(3, "0")}</div>
        </div>
        <div className="text-right">
          <div>{issuer?.city ? `${issuer.city}, ` : ""}{fmtDate(invoice.issue_date, { day: "numeric", month: "long", year: "numeric" })}</div>
          {invoice.due_date && <div className="text-muted">Vence: {fmtDate(invoice.due_date)}</div>}
        </div>
      </div>

      <div className="mt-8">
        <div className="font-semibold uppercase">{clientLabel(client)}</div>
        {client?.document_id && <div>NIT / C.C. {client.document_id}</div>}
      </div>

      <div className="mt-8 text-center">
        <div className="text-[12px] tracking-[0.3em] text-muted">DEBE A</div>
        <div className="mt-2 text-[16px] font-semibold">{issuer?.full_name}</div>
        {issuer?.document_id && <div>C.C. / NIT {issuer.document_id}</div>}
      </div>

      <div className="mt-8">
        <div className="text-muted text-[11px]">La suma de</div>
        <div className="font-medium">
          {money(sum)} <span className="font-normal text-muted">({numberToWords(sum)} pesos m/cte)</span>
        </div>
        <div className="text-muted text-[11px] mt-4">Por concepto de</div>
        <div className="font-medium">{invoice.concept}</div>
      </div>

      <ItemsTable items={items} />
      <div className="flex justify-end mt-5">
        <div className="text-right">
          <div className="text-[11px] text-muted">Total a pagar</div>
          <div className="text-[26px] font-semibold tracking-tight">{money(sum)}</div>
        </div>
      </div>

      {(issuer?.bank_info || invoice.notes) && (
        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          {issuer?.bank_info && (
            <div className="rounded-xl bg-surface p-4 whitespace-pre-wrap leading-relaxed">
              <div className="text-[11px] text-muted mb-1">Datos para el pago</div>{issuer.bank_info}
            </div>
          )}
          {invoice.notes && (
            <div className="rounded-xl bg-surface p-4 whitespace-pre-wrap leading-relaxed">
              <div className="text-[11px] text-muted mb-1">Notas</div>{invoice.notes}
            </div>
          )}
        </div>
      )}

      <div className="mt-16 w-64">
        <div className="border-t border-ink pt-2">
          <div className="font-medium">{issuer?.full_name}</div>
          {issuer?.document_id && <div className="text-muted">C.C. / NIT {issuer.document_id}</div>}
          {issuer?.phone && <div className="text-muted">{issuer.phone}</div>}
        </div>
      </div>
    </div>
  );
}

export function fmtWhen(d: string | null) {
  return d ? fmtDateTime(d) : "Sin fecha";
}
