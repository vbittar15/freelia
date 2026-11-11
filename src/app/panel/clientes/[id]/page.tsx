import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { requireCreative } from "@/lib/auth";
import { Avatar, EmptyState, Notice, Row, RowList, Section, Stat, StatusBadge } from "@/components/ui";
import { ConfirmSubmit, SubmitButton } from "@/components/client-ui";
import { InvitePanel } from "@/components/invite-panel";
import { newContract } from "../../contratos/actions";
import { ContentCalendar, monthRange } from "@/components/content-calendar";
import { Lia, Sparkle, StatusPill } from "@/components/brand";
import type { Brief, Client, ClientService, Contract, Invoice, Post, Quote } from "@/lib/types";
import { FORMATS, NETWORKS, cn, fmtDate, fmtDateTime, isoToBogotaLocal, money, total } from "@/lib/utils";
import { archiveClient, deleteClient, resetInvite } from "../../actions";

const TABS = [
  { k: "resumen", l: "Resumen" },
  { k: "parrilla", l: "Parrilla" },
  { k: "briefs", l: "Solicitudes" },
  { k: "cotizaciones", l: "Cotizaciones" },
  { k: "cobros", l: "Cobros" },
] as const;

type SP = { tab?: string; mes?: string; vista?: string; nuevo?: string; enlace?: string };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const { id } = await params;
  const sp = await searchParams;
  const tab = TABS.some((t) => t.k === sp.tab) ? sp.tab! : "resumen";
  const { supabase, profile } = await requireCreative();
  const { data } = await supabase.from("clients").select("*").eq("id", id).single();
  if (!data) notFound();
  const c = data as Client;

  const [{ data: postsD }, { data: briefsD }, { data: quotesD }, { data: invoicesD }, { data: svcD }, { data: kD }] = await Promise.all([
    supabase.from("posts").select("*").eq("client_id", id).order("scheduled_at", { ascending: true, nullsFirst: false }),
    supabase.from("briefs").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("quotes").select("*, quote_items(quantity, unit_price)").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("invoices").select("*, invoice_items(quantity, unit_price)").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("client_services").select("*").eq("client_id", id).order("position"),
    supabase.from("contracts").select("id, number, status, sent_at, signed_at, created_at").eq("client_id", id).order("created_at", { ascending: false }),
  ]);
  const svcs = (svcD ?? []) as ClientService[];
  const contracts = (kD ?? []) as Pick<Contract, "id" | "number" | "status" | "sent_at" | "signed_at" | "created_at">[];
  const monthly = svcs.filter((x) => x.period === "mensual").reduce((a, x) => a + Number(x.price) * Number(x.qty), 0);
  const once = svcs.filter((x) => x.period === "unico").reduce((a, x) => a + Number(x.price) * Number(x.qty), 0);
  const K_LABEL = { borrador: "Borrador", enviado: "Esperando firma", firmado: "Firmado", anulado: "Anulado" } as const;
  const K_STATE = { borrador: "borrador", enviado: "en_revision", firmado: "aprobado", anulado: "rechazada" } as const;
  const posts = (postsD ?? []) as Post[];
  const briefs = (briefsD ?? []) as Brief[];
  const quotes = (quotesD ?? []) as Quote[];
  const invoices = (invoicesD ?? []) as Invoice[];

  const now = new Date().toISOString();
  const today = isoToBogotaLocal(now).slice(0, 10);
  const inReview = posts.filter((p) => p.status === "en_revision");
  const changes = posts.filter((p) => p.status === "cambios");
  const upcoming = posts.filter((p) => p.scheduled_at && p.scheduled_at >= now).slice(0, 5);
  const pendingInv = invoices.filter((i) => i.status === "enviada");
  const late = pendingInv.filter((i) => i.due_date && i.due_date < today);
  const owed = pendingInv.reduce((s, i) => s + total(i.invoice_items), 0);
  const paid = invoices.filter((i) => i.status === "pagada").reduce((s, i) => s + total(i.invoice_items), 0);
  const invStatus = (i: Invoice) => (i.status === "enviada" ? (i.due_date && i.due_date < today ? "vencida" : "pendiente") : i.status);

  const h = await headers();
  const site = process.env.NEXT_PUBLIC_SITE_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const invite = `${site}/invitacion/${c.invite_token}`;
  const base = `/panel/clientes/${c.id}`;
  const href = (patch: Partial<SP>) => {
    const p = new URLSearchParams();
    Object.entries({ tab, mes: sp.mes, vista: sp.vista, ...patch }).forEach(([k, v]) => v && v !== "resumen" && p.set(k, v));
    const q = p.toString();
    return q ? `${base}?${q}` : base;
  };

  return (
    <>
      <Link href="/panel/clientes" className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-dark hover:underline mb-3">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 6l-6 6 6 6" /></svg>
        Clientes
      </Link>

      {/* Encabezado del cliente */}
      <div className="relative overflow-hidden rounded-[32px] px-6 md:px-8 py-6 md:py-7 mb-6" style={{ background: (c.color ?? "#DCE3FF") + "99" }}>
        <Sparkle size={14} className="absolute right-[120px] top-6 hidden sm:block" />
        <Sparkle size={9} color="#A98BFF" className="absolute right-[142px] top-12 hidden sm:block" />
        <div className="flex flex-col xl:flex-row xl:items-center gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="anim-pop shrink-0"><Avatar name={c.company || c.name} size={60} color="#FFFFFF" /></div>
          <div className="min-w-0 flex-1">
            <h1 className="h1 truncate">{c.company || c.name}</h1>
            <div className="text-[14px] text-ink/70 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              {c.company && <span>{c.name}</span>}
              {c.phone && <span>{c.phone}</span>}
              {c.email && <span className="truncate max-w-full">{c.email}</span>}
              {c.client_user_id ? <StatusPill status="aprobado" label="En su portal" /> : <StatusPill status="borrador" label="Sin conectar" />}
            </div>
          </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/panel/parrilla/nueva?cliente=${c.id}`} className="btn btn-primary btn-sm">+ Pieza</Link>
            <Link href={`/panel/mensajes/${c.id}`} className="btn btn-sm bg-white text-ink hover:bg-surface">Mensajes</Link>
            <Link href={`${base}/editar`} className="btn btn-sm bg-white/60 text-ink hover:bg-white">Editar</Link>
          </div>
        </div>
      </div>

      {sp.nuevo && <Notice tone="ok">¡Cliente creado! Ahora envíale su enlace para que entre a su portal.</Notice>}
      {sp.enlace && <Notice tone="info">Listo, generaste un enlace nuevo. El anterior ya no funciona.</Notice>}

      {/* Pestañas */}
      <nav className="flex gap-1 overflow-x-auto mb-7 -mx-1 px-1 pb-1">
        {TABS.map((t) => (
          <Link key={t.k} href={href({ tab: t.k, mes: undefined, vista: undefined })}
            className={cn("btn btn-sm shrink-0", tab === t.k ? "bg-ink text-white" : "bg-surface text-ink hover:bg-surface-2")}>
            {t.l}
            {t.k === "parrilla" && inReview.length + changes.length > 0 && <span className={cn("min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold inline-flex items-center justify-center", tab === t.k ? "bg-white text-ink" : "bg-brand-soft")}>{inReview.length + changes.length}</span>}
          </Link>
        ))}
      </nav>

      {tab === "resumen" && (
        <div className="space-y-9">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="En revisión" value={inReview.length} tone="cielo" href={href({ tab: "parrilla", vista: "lista" })} />
            <Stat label="Cambios pedidos" value={changes.length} tone="rosa" href={href({ tab: "parrilla", vista: "lista" })} />
            <Stat label="Por cobrar" value={money(owed)} tone="mantequilla" href={href({ tab: "cobros" })} />
            <Stat label="Cobrado" value={money(paid)} tone="menta" href={href({ tab: "cobros" })} />
          </div>

          {!c.client_user_id && (
            <div className="max-w-2xl">
              <InvitePanel link={invite} clientName={c.name} creativeName={profile.business_name || profile.full_name || "Tu equipo creativo"}
                phone={c.phone} email={c.email} highlight={!!sp.nuevo} />
              <form action={resetInvite} className="mt-2 px-1">
                <input type="hidden" name="id" value={c.id} />
                <SubmitButton className="text-[12px] font-semibold text-brand-dark hover:underline cursor-pointer" pendingText="Generando…">Generar un enlace nuevo</SubmitButton>
              </form>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-9 lg:gap-8 [&>*]:min-w-0">
            <Section title="Servicios" action={<Link href={`/panel/clientes/${c.id}/editar`} className="text-[13px] font-semibold text-brand-dark">Editar</Link>}>
              {svcs.length ? (
                <div className="card p-5">
                  <div className="flex flex-col gap-2">
                    {svcs.map((x) => (
                      <div key={x.id} className="flex items-start justify-between gap-3 text-[14px]">
                        <div className="min-w-0">
                          <div className="font-semibold">{Number(x.qty) !== 1 && `${x.qty} × `}{x.name}{x.package_id && <span className="ml-2 badge bg-lila-t text-ink">Paquete</span>}</div>
                          {x.includes && <div className="text-[12px] text-muted">{x.includes}</div>}
                        </div>
                        <div className="text-right shrink-0 font-semibold">{money(Number(x.price) * Number(x.qty))}<div className="text-[11px] text-muted font-normal">{x.period === "mensual" ? "al mes" : "pago único"}</div></div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-line flex flex-wrap gap-x-6 text-[14px]">
                    {monthly > 0 && <span>Mensual <b>{money(monthly)}</b></span>}
                    {once > 0 && <span>Pago único <b>{money(once)}</b></span>}
                  </div>
                </div>
              ) : (
                <div className="card p-5 text-[14px] text-muted">Aún no defines qué servicios le prestas. <Link href={`/panel/clientes/${c.id}/editar`} className="font-semibold text-brand-dark">Agregarlos</Link></div>
              )}
            </Section>
            <Section title="Contrato" action={<form action={newContract}><input type="hidden" name="client_id" value={c.id} /><SubmitButton className="text-[13px] font-semibold text-brand-dark cursor-pointer" pendingText="Creando…">+ Nuevo</SubmitButton></form>}>
              <RowList empty={<div className="card p-5 text-[14px] text-muted">Sin contrato. Crea uno con los servicios de este cliente y envíaselo para firmar desde la app.</div>}>
                {contracts.map((k) => (
                  <Row key={k.id} href={`/panel/contratos/${k.id}`} status={K_STATE[k.status]} title={`Contrato N.º ${k.number}`}
                    sub={k.signed_at ? `Firmado el ${fmtDate(k.signed_at)}` : k.sent_at ? `Enviado el ${fmtDate(k.sent_at)}` : `Creado el ${fmtDate(k.created_at)}`}
                    pill={<StatusBadge status={K_STATE[k.status]} label={K_LABEL[k.status]} />} />
                ))}
              </RowList>
            </Section>
          </div>

          <div className="grid lg:grid-cols-2 gap-9 lg:gap-8 [&>*]:min-w-0">
            <Section title="Para hoy" count={changes.length + late.length}>
              <RowList empty={<div className="card flex items-center gap-4 px-5 py-5"><Lia size={40} mood="sleep" color="#A98BFF" /><span className="text-muted font-medium">Nada pendiente con este cliente</span></div>}>
                {[
                  ...changes.map((p) => <Row key={p.id} href={`/panel/parrilla/${p.id}`} status="cambios" title={p.title} sub="Pidió cambios" />),
                  ...late.map((i) => <Row key={i.id} href={`/panel/cobros/${i.id}`} status="vencida" title={`Cuenta de cobro ${String(i.number).padStart(3, "0")}`} sub={`Venció el ${fmtDate(i.due_date)}`} right={money(total(i.invoice_items))} />),
                ]}
              </RowList>
            </Section>
            <Section title="Esperando al cliente">
              <RowList empty={<p className="text-muted px-1">Nada en revisión.</p>}>
                {inReview.map((p) => <Row key={p.id} href={`/panel/parrilla/${p.id}`} status="en_revision" title={p.title} sub={`Enviada · ${p.scheduled_at ? fmtDateTime(p.scheduled_at) : "sin fecha"}`} />)}
              </RowList>
            </Section>
          </div>

          <div className="grid lg:grid-cols-2 gap-9 lg:gap-8 [&>*]:min-w-0">
            <Section title="Próximas publicaciones" action={<Link href={href({ tab: "parrilla" })} className="text-[13px] font-semibold text-brand-dark">Ver parrilla</Link>}>
              <RowList empty={<p className="text-muted px-1">Nada programado.</p>}>
                {upcoming.map((p) => <Row key={p.id} href={`/panel/parrilla/${p.id}`} status={p.status} title={p.title} sub={`${NETWORKS[p.network] ?? p.network} · ${fmtDateTime(p.scheduled_at)}`} />)}
              </RowList>
            </Section>
            <Section title="Sobre el cliente">
              <div className="card p-5 space-y-3 text-[14px]">
                <div><div className="text-[12px] text-muted">Contacto</div>{c.name}</div>
                {c.email && <div><div className="text-[12px] text-muted">Correo</div>{c.email}</div>}
                {c.phone && <div><div className="text-[12px] text-muted">WhatsApp</div>{c.phone}</div>}
                {c.document_id && <div><div className="text-[12px] text-muted">NIT / C.C.</div>{c.document_id}</div>}
                {c.notes && <div><div className="text-[12px] text-muted">Notas</div><p className="whitespace-pre-wrap">{c.notes}</p></div>}
                <div className="text-[12px] text-muted pt-1">Cliente desde {fmtDate(c.created_at)}</div>
              </div>
              <div className="flex gap-2 mt-3">
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
            </Section>
          </div>
        </div>
      )}

      {tab === "parrilla" && (() => {
        const list = sp.vista === "lista";
        const { start, end } = monthRange(sp.mes);
        const monthPosts = posts.filter((p) => p.scheduled_at && p.scheduled_at >= start && p.scheduled_at < end);
        const undated = posts.filter((p) => !p.scheduled_at);
        return (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <Link href={`/panel/parrilla/nueva?cliente=${c.id}`} className="btn btn-primary btn-sm">+ Nueva pieza</Link>
              {(() => { const k = posts.filter((p) => p.status === "borrador" || p.status === "cambios").length; return k > 0 && <Link href={`/panel/enviar?cliente=${c.id}`} className="btn btn-soft btn-sm">Enviar a revisión ({k})</Link>; })()}
              <div className="ml-auto flex rounded-full bg-surface p-1">
                <Link href={href({ vista: undefined })} className={cn("btn btn-sm", !list ? "bg-white shadow-sm text-ink" : "text-muted font-medium")}>Calendario</Link>
                <Link href={href({ vista: "lista" })} className={cn("btn btn-sm", list ? "bg-white shadow-sm text-ink" : "text-muted font-medium")}>Lista</Link>
              </div>
            </div>
            {list ? (
              <RowList empty={<EmptyState title="Aún no hay piezas" text="Crea la primera pieza de la parrilla de este cliente." />}>
                {[...posts].reverse().map((p) => (
                  <Row key={p.id} href={`/panel/parrilla/${p.id}`} status={p.status} title={p.title}
                    sub={`${NETWORKS[p.network] ?? p.network} · ${FORMATS[p.format] ?? p.format} · ${p.scheduled_at ? fmtDateTime(p.scheduled_at) : "Sin fecha"}`}
                    pill={<StatusBadge status={p.status} />} />
                ))}
              </RowList>
            ) : (
              <ContentCalendar posts={monthPosts} undated={undated} mes={sp.mes} showClient={false}
                monthHref={(mes) => href({ mes })}
                newHref={(day) => `/panel/parrilla/nueva?cliente=${c.id}&fecha=${day}`} />
            )}
          </>
        );
      })()}

      {tab === "briefs" && (
        <>
          <div className="mb-5"><Link href={`/panel/briefs/nuevo?cliente=${c.id}`} className="btn btn-primary btn-sm">+ Nuevo brief</Link></div>
          <RowList empty={<EmptyState title="Sin briefs todavía" text="Crea uno o espera a que tu cliente te envíe un pedido desde su portal." />}>
            {briefs.map((b) => <Row key={b.id} href={`/panel/briefs/${b.id}`} status={b.status} title={b.title} sub={`Entrega ${fmtDate(b.deadline)}`} pill={<StatusBadge status={b.status} />} />)}
          </RowList>
        </>
      )}

      {tab === "cotizaciones" && (
        <>
          <div className="mb-5"><Link href={`/panel/cotizaciones/nueva?cliente=${c.id}`} className="btn btn-primary btn-sm">+ Nueva cotización</Link></div>
          <RowList empty={<EmptyState title="Sin cotizaciones" />}>
            {quotes.map((q) => <Row key={q.id} href={`/panel/cotizaciones/${q.id}`} status={q.status} title={q.title} sub={`${String(q.number).padStart(3, "0")} · ${fmtDate(q.created_at)}`} right={money(total(q.quote_items))} pill={<StatusBadge status={q.status} />} />)}
          </RowList>
        </>
      )}

      {tab === "cobros" && (
        <>
          <div className="mb-5"><Link href={`/panel/cobros/nueva?cliente=${c.id}`} className="btn btn-primary btn-sm">+ Nueva cuenta de cobro</Link></div>
          <RowList empty={<EmptyState title="Sin cuentas de cobro" />}>
            {invoices.map((i) => <Row key={i.id} href={`/panel/cobros/${i.id}`} status={invStatus(i)} title={`N.º ${String(i.number).padStart(3, "0")} · ${i.concept}`} sub={`Vence ${fmtDate(i.due_date)}`} right={money(total(i.invoice_items))} pill={<StatusBadge status={invStatus(i)} />} />)}
          </RowList>
        </>
      )}
    </>
  );
}
