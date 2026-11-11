import Link from "next/link";
import { redirect } from "next/navigation";
import { NotifyCard } from "@/components/pwa";
import { requireCreative } from "@/lib/auth";
import { Lia, Trazo } from "@/components/brand";
import { Hero, Row, RowList, Section, Stat } from "@/components/ui";
import type { Brief, Invoice, Post } from "@/lib/types";
import { NETWORKS, clientLabel, fmtDate, fmtDateTime, isoToBogotaLocal, money, total } from "@/lib/utils";

export const metadata = { title: "Inicio" };

export default async function Dashboard() {
  const { supabase, profile } = await requireCreative();
  if (!profile.onboarded_at && profile.onboarded_at !== undefined) redirect("/bienvenida");
  const now = new Date();
  const in14 = new Date(now.getTime() + 14 * 86400000).toISOString();
  const today = isoToBogotaLocal(now.toISOString()).slice(0, 10);

  const [{ count: clientsCount }, { data: upcoming }, { data: review }, { data: changes }, { data: invoices }, { data: briefs }] =
    await Promise.all([
      supabase.from("clients").select("id", { count: "exact", head: true }).eq("archived", false),
      supabase.from("posts").select("*, clients(name, company, color)")
        .gte("scheduled_at", now.toISOString()).lte("scheduled_at", in14).order("scheduled_at").limit(5),
      supabase.from("posts").select("*, clients(name, company, color)").eq("status", "en_revision").order("updated_at", { ascending: false }).limit(5),
      supabase.from("posts").select("*, clients(name, company, color)").eq("status", "cambios").order("updated_at", { ascending: false }).limit(5),
      supabase.from("invoices").select("*, invoice_items(quantity, unit_price), clients(name, company, color)").eq("status", "enviada").order("due_date"),
      supabase.from("briefs").select("*, clients(name, company, color)").eq("status", "nuevo").order("created_at", { ascending: false }).limit(5),
    ]);

  const inv = (invoices ?? []) as Invoice[];
  const late = inv.filter((i) => i.due_date && i.due_date < today);
  const owed = inv.reduce((s, i) => s + total(i.invoice_items), 0);
  const changesL = (changes ?? []) as Post[];
  const briefsL = (briefs ?? []) as Brief[];
  const pendingCount = changesL.length + late.length + briefsL.length;

  const firstName = (profile.full_name ?? "").split(" ")[0];
  const dateLabel = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Bogota" }).format(now);

  return (
    <div className="space-y-9">
      <Hero>
        <div className="text-[13px] font-medium text-muted first-letter:uppercase">{dateLabel}</div>
        <h1 className="h1 mt-1">Hola{firstName ? `, ${firstName}` : ""}.</h1>
        <p className="text-[17px] leading-[26px] mt-1">
          {pendingCount > 0 ? <>Hoy tienes <Trazo>{pendingCount} {pendingCount === 1 ? "pendiente" : "pendientes"}</Trazo></> : <>Todo en orden por <Trazo>hoy</Trazo></>}
        </p>
        {late.length > 0 && (
          <div className="mt-5 inline-flex items-center gap-3 bg-white rounded-[18px] pl-4 pr-2 py-2 shadow-[0_2px_10px_rgba(34,26,58,.06)]">
            <span className="text-[13px] font-medium">¿Le recuerdas el pago a {clientLabel(late[0].clients)}?</span>
            <Link href={`/panel/mensajes/${late[0].client_id}`} className="btn btn-primary btn-sm">Sí</Link>
          </div>
        )}
      </Hero>

      <NotifyCard compact />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Clientes activos" value={clientsCount ?? 0} tone="cielo" href="/panel/clientes" />
        <Stat label="Esperando al cliente" value={(review ?? []).length} tone="lavanda" href="/panel/parrilla?estado=en_revision" />
        <Stat label="Solicitudes nuevas" value={briefsL.length} tone="mantequilla" href="/panel/briefs?ver=nuevas" />
        <Stat label="Por cobrar" value={money(owed)} tone="menta" href="/panel/cobros" />
      </div>

      <div className="grid lg:grid-cols-2 gap-9 lg:gap-8 [&>*]:min-w-0">
        <Section title="Para hoy" count={pendingCount}>
          <RowList empty={
            <div className="card flex items-center gap-4 px-5 py-6">
              <Lia size={44} mood="sleep" color="#A98BFF" />
              <span className="text-muted font-medium">Nada pendiente por hoy</span>
            </div>
          }>
            {[
              ...changesL.map((p) => <Row key={p.id} href={`/panel/parrilla/${p.id}`} status="cambios" title={p.title} sub={`${clientLabel(p.clients)} pidió cambios`} />),
              ...late.map((i) => <Row key={i.id} href={`/panel/cobros/${i.id}`} status="vencida" title={`Cuenta de cobro ${String(i.number).padStart(3, "0")}`} sub={`${clientLabel(i.clients)} · ${money(total(i.invoice_items))}`} />),
              ...briefsL.map((b) => <Row key={b.id} href={`/panel/briefs/${b.id}`} status="nuevo" title={b.title} sub={`${clientLabel(b.clients)} · entrega ${fmtDate(b.deadline)}`} />),
            ]}
          </RowList>
        </Section>

        <Section title="Esperando al cliente">
          <RowList empty={<p className="text-muted px-1">Nada en revisión ahora mismo.</p>}>
            {((review ?? []) as Post[]).map((p) => (
              <Row key={p.id} href={`/panel/parrilla/${p.id}`} status="en_revision" title={p.title} sub={`${clientLabel(p.clients)} lo está revisando`} />
            ))}
          </RowList>
        </Section>
      </div>

      <div className="grid lg:grid-cols-2 gap-9 lg:gap-8 [&>*]:min-w-0">
        <Section title="Próximas publicaciones" action={<Link href="/panel/parrilla" className="text-[13px] font-semibold text-brand-dark">Ver parrilla</Link>}>
          <RowList empty={<p className="text-muted px-1">Nada programado en las próximas dos semanas.</p>}>
            {((upcoming ?? []) as Post[]).map((p) => (
              <Row key={p.id} href={`/panel/parrilla/${p.id}`} status={p.status} title={p.title}
                sub={`${clientLabel(p.clients)} · ${NETWORKS[p.network] ?? p.network} · ${fmtDateTime(p.scheduled_at)}`} />
            ))}
          </RowList>
        </Section>

        <Section title="Cobros pendientes" action={<Link href="/panel/cobros/nueva" className="text-[13px] font-semibold text-brand-dark">Nueva</Link>}>
          <RowList empty={<p className="text-muted px-1">No tienes cobros pendientes.</p>}>
            {inv.map((i) => {
              const isLate = !!i.due_date && i.due_date < today;
              return (
                <Row key={i.id} href={`/panel/cobros/${i.id}`} status={isLate ? "vencida" : "pendiente"}
                  title={`N.º ${String(i.number).padStart(3, "0")} · ${i.concept}`}
                  sub={`${clientLabel(i.clients)} · vence ${fmtDate(i.due_date)}`} right={money(total(i.invoice_items))} />
              );
            })}
          </RowList>
        </Section>
      </div>
    </div>
  );
}
