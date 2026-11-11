import Link from "next/link";
import { requireCreative } from "@/lib/auth";
import { Lia } from "@/components/brand";
import { ClientChip, Section, Stat, StatusBadge } from "@/components/ui";
import type { Invoice, Post } from "@/lib/types";
import { NETWORKS, clientLabel, fmtDate, fmtDateTime, money, total } from "@/lib/utils";

export const metadata = { title: "Inicio" };

export default async function Dashboard() {
  const { supabase, profile } = await requireCreative();
  const now = new Date();
  const in14 = new Date(now.getTime() + 14 * 86400000).toISOString();

  const [{ count: clientsCount }, { data: upcoming }, { data: pending }, { data: changes }, { data: invoices }, { count: newBriefs }] =
    await Promise.all([
      supabase.from("clients").select("id", { count: "exact", head: true }).eq("archived", false),
      supabase.from("posts").select("*, clients(name, company, color)")
        .gte("scheduled_at", now.toISOString()).lte("scheduled_at", in14).order("scheduled_at").limit(6),
      supabase.from("posts").select("id", { count: "exact" }).eq("status", "en_revision"),
      supabase.from("posts").select("*, clients(name, company, color)").eq("status", "cambios").order("updated_at", { ascending: false }).limit(5),
      supabase.from("invoices").select("*, invoice_items(quantity, unit_price), clients(name, company, color)").eq("status", "enviada").order("due_date"),
      supabase.from("briefs").select("id", { count: "exact", head: true }).eq("status", "nuevo"),
    ]);

  const owed = (invoices as Invoice[] | null ?? []).reduce((s, i) => s + total(i.invoice_items), 0);
  const firstName = (profile.full_name ?? "").split(" ")[0];
  const hour = Number(new Intl.DateTimeFormat("es-CO", { hour: "numeric", hour12: false, timeZone: "America/Bogota" }).format(now));
  const greet = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-4">
        <Lia size={48} mood="wink" />
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">{greet}{firstName ? `, ${firstName}` : ""}</h1>
          <p className="text-muted">Esto es lo que pasa hoy en tu estudio.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Clientes activos" value={clientsCount ?? 0} tone="cielo" href="/panel/clientes" />
        <Stat label="Esperando aprobación" value={pending?.length ?? 0} tone="mantequilla" href="/panel/parrilla?estado=en_revision" />
        <Stat label="Briefs nuevos" value={newBriefs ?? 0} tone="lavanda" href="/panel/briefs" />
        <Stat label="Por cobrar" value={money(owed)} tone="menta" href="/panel/cobros" />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Section title="Próximas publicaciones" action={<Link href="/panel/parrilla" className="text-[12px] text-brand">Ver parrilla →</Link>}>
          <div className="card divide-y divide-line">
            {(upcoming as Post[] | null)?.length ? (upcoming as Post[]).map((p) => (
              <Link key={p.id} href={`/panel/parrilla/${p.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface/60">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{p.title}</div>
                  <div className="text-[12px] text-muted flex items-center gap-2">
                    <ClientChip name={clientLabel(p.clients)} color={p.clients?.color} /> · {NETWORKS[p.network] ?? p.network} · {fmtDateTime(p.scheduled_at)}
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            )) : <p className="px-5 py-8 text-center text-muted">Nada programado en las próximas dos semanas.</p>}
          </div>
        </Section>

        <Section title="Piden cambios">
          <div className="card divide-y divide-line">
            {(changes as Post[] | null)?.length ? (changes as Post[]).map((p) => (
              <Link key={p.id} href={`/panel/parrilla/${p.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface/60">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{p.title}</div>
                  <div className="text-[12px] text-muted"><ClientChip name={clientLabel(p.clients)} color={p.clients?.color} /></div>
                </div>
                <StatusBadge status="cambios" />
              </Link>
            )) : <p className="px-5 py-8 text-center text-muted">Ninguna pieza con cambios pendientes. ✨</p>}
          </div>
        </Section>
      </div>

      <Section title="Cuentas de cobro pendientes" action={<Link href="/panel/cobros/nueva" className="btn btn-soft btn-sm">+ Nueva</Link>}>
        <div className="card divide-y divide-line">
          {(invoices as Invoice[] | null)?.length ? (invoices as Invoice[]).map((i) => {
            const late = i.due_date && i.due_date < now.toISOString().slice(0, 10);
            return (
              <Link key={i.id} href={`/panel/cobros/${i.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface/60">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">N.º {i.number} · {i.concept}</div>
                  <div className="text-[12px] text-muted"><ClientChip name={clientLabel(i.clients)} color={i.clients?.color} /> · vence {fmtDate(i.due_date)}</div>
                </div>
                <div className="font-medium">{money(total(i.invoice_items))}</div>
                <StatusBadge status={late ? "vencida" : "enviada"} label={late ? "Vencida" : "Pendiente"} />
              </Link>
            );
          }) : <p className="px-5 py-8 text-center text-muted">No tienes cobros pendientes.</p>}
        </div>
      </Section>
    </div>
  );
}
