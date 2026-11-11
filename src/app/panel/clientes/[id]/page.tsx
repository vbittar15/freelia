import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { requireCreative } from "@/lib/auth";
import { Avatar, PageHeader, Section, StatusBadge } from "@/components/ui";
import { ConfirmSubmit, CopyButton, SubmitButton } from "@/components/client-ui";
import type { Brief, Client, Invoice, Post, Quote } from "@/lib/types";
import { NETWORKS, fmtDate, fmtDateTime, money, total } from "@/lib/utils";
import { archiveClient, deleteClient } from "../../actions";

function List({ children, empty }: { children: React.ReactNode[]; empty: string }) {
  return (
    <div className="card divide-y divide-line">
      {children.length ? children : <p className="px-5 py-6 text-center text-muted text-[13px]">{empty}</p>}
    </div>
  );
}
const row = "flex items-center gap-3 px-5 py-3 hover:bg-surface/60";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireCreative();
  const { data } = await supabase.from("clients").select("*").eq("id", id).single();
  if (!data) notFound();
  const c = data as Client;

  const [{ data: briefs }, { data: posts }, { data: quotes }, { data: invoices }] = await Promise.all([
    supabase.from("briefs").select("*").eq("client_id", id).order("created_at", { ascending: false }).limit(5),
    supabase.from("posts").select("*").eq("client_id", id).order("scheduled_at", { ascending: false, nullsFirst: true }).limit(6),
    supabase.from("quotes").select("*, quote_items(quantity, unit_price)").eq("client_id", id).order("created_at", { ascending: false }).limit(5),
    supabase.from("invoices").select("*, invoice_items(quantity, unit_price)").eq("client_id", id).order("created_at", { ascending: false }).limit(5),
  ]);

  const h = await headers();
  const site = process.env.NEXT_PUBLIC_SITE_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const invite = `${site}/registro?rol=cliente&email=${encodeURIComponent(c.email ?? "")}`;

  return (
    <>
      <PageHeader
        back={{ href: "/panel/clientes", label: "Clientes" }}
        title={<span className="flex items-center gap-3"><Avatar name={c.company || c.name} size={40} color={c.color} />{c.company || c.name}</span>}
        actions={<>
          <Link href={`/panel/mensajes/${c.id}`} className="btn btn-soft">Mensajes</Link>
          <Link href={`/panel/clientes/${c.id}/editar`} className="btn btn-ghost">Editar</Link>
        </>}
      />

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-8">
          <Section title="Parrilla" action={<Link href={`/panel/parrilla/nueva?cliente=${c.id}`} className="btn btn-soft btn-sm">+ Pieza</Link>}>
            <List empty="Sin piezas todavía.">
              {((posts ?? []) as Post[]).map((p) => (
                <Link key={p.id} href={`/panel/parrilla/${p.id}`} className={row}>
                  <div className="flex-1 min-w-0"><div className="font-medium truncate">{p.title}</div>
                    <div className="text-[12px] text-muted">{NETWORKS[p.network]} · {p.scheduled_at ? fmtDateTime(p.scheduled_at) : "Sin fecha"}</div></div>
                  <StatusBadge status={p.status} />
                </Link>
              ))}
            </List>
          </Section>
          <Section title="Briefs" action={<Link href={`/panel/briefs/nuevo?cliente=${c.id}`} className="btn btn-soft btn-sm">+ Brief</Link>}>
            <List empty="Sin briefs todavía.">
              {((briefs ?? []) as Brief[]).map((b) => (
                <Link key={b.id} href={`/panel/briefs/${b.id}`} className={row}>
                  <div className="flex-1 min-w-0"><div className="font-medium truncate">{b.title}</div>
                    <div className="text-[12px] text-muted">Entrega {fmtDate(b.deadline)}</div></div>
                  <StatusBadge status={b.status} />
                </Link>
              ))}
            </List>
          </Section>
          <div className="grid sm:grid-cols-2 gap-6">
            <Section title="Cotizaciones" action={<Link href={`/panel/cotizaciones/nueva?cliente=${c.id}`} className="btn btn-soft btn-sm">+</Link>}>
              <List empty="Sin cotizaciones.">
                {((quotes ?? []) as Quote[]).map((q) => (
                  <Link key={q.id} href={`/panel/cotizaciones/${q.id}`} className={row}>
                    <div className="flex-1 min-w-0"><div className="truncate">#{q.number} {q.title}</div>
                      <div className="text-[12px] text-muted">{money(total(q.quote_items))}</div></div>
                    <StatusBadge status={q.status} />
                  </Link>
                ))}
              </List>
            </Section>
            <Section title="Cobros" action={<Link href={`/panel/cobros/nueva?cliente=${c.id}`} className="btn btn-soft btn-sm">+</Link>}>
              <List empty="Sin cuentas de cobro.">
                {((invoices ?? []) as Invoice[]).map((i) => (
                  <Link key={i.id} href={`/panel/cobros/${i.id}`} className={row}>
                    <div className="flex-1 min-w-0"><div className="truncate">N.º {i.number} {i.concept}</div>
                      <div className="text-[12px] text-muted">{money(total(i.invoice_items))}</div></div>
                    <StatusBadge status={i.status} />
                  </Link>
                ))}
              </List>
            </Section>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card p-5 space-y-3 text-[13px]">
            <div><div className="text-[11px] text-muted">Contacto</div>{c.name}</div>
            {c.email && <div><div className="text-[11px] text-muted">Correo</div>{c.email}</div>}
            {c.phone && <div><div className="text-[11px] text-muted">Teléfono</div>{c.phone}</div>}
            {c.document_id && <div><div className="text-[11px] text-muted">NIT / C.C.</div>{c.document_id}</div>}
            {c.notes && <div><div className="text-[11px] text-muted">Notas</div><p className="whitespace-pre-wrap">{c.notes}</p></div>}
          </div>

          <div className="rounded-2xl bg-cielo p-5">
            {c.client_user_id ? (
              <>
                <div className="font-medium">✓ Conectado a Freelia</div>
                <p className="text-[13px] text-muted mt-1">Tu cliente ve las piezas que envías a aprobación, sus cotizaciones y cobros, y puede escribirte.</p>
              </>
            ) : c.email ? (
              <>
                <div className="font-medium">Invita a tu cliente</div>
                <p className="text-[13px] text-muted mt-1 mb-3">Envíale este enlace. Al crear su cuenta con <b>{c.email}</b> quedará conectado.</p>
                <CopyButton text={invite} label="Copiar invitación" />
              </>
            ) : (
              <>
                <div className="font-medium">Invita a tu cliente</div>
                <p className="text-[13px] text-muted mt-1">Agrega su correo para poder invitarlo a aprobar y chatear.</p>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <form action={archiveClient}>
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="archived" value={String(!c.archived)} />
              <SubmitButton className="btn btn-ghost btn-sm">{c.archived ? "Reactivar" : "Archivar"}</SubmitButton>
            </form>
            <form action={deleteClient}>
              <input type="hidden" name="id" value={c.id} />
              <ConfirmSubmit message="¿Eliminar este cliente y TODO su historial (briefs, parrilla, cotizaciones, cobros y mensajes)? No se puede deshacer.">Eliminar</ConfirmSubmit>
            </form>
          </div>
        </aside>
      </div>
    </>
  );
}
