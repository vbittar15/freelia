import Link from "next/link";
import { NotifyCard } from "@/components/pwa";
import { requireClient } from "@/lib/auth";
import { Lia, Logo, Trazo } from "@/components/brand";
import { Hero, Row, RowList, Section } from "@/components/ui";
import type { Invoice, Post, Quote } from "@/lib/types";
import { FORMATS, NETWORKS, fmtDate, fmtDateTime, money, total } from "@/lib/utils";
import { creativeName, getWorkspaces } from "./data";

export const metadata = { title: "Inicio" };

export default async function Page() {
  const { supabase, user, profile } = await requireClient();
  const workspaces = await getWorkspaces(supabase, user.id);
  const firstName = (profile.full_name ?? "").split(" ")[0];

  if (workspaces.length === 0) {
    return (
      <div className="card flex flex-col items-center text-center px-6 py-16 max-w-xl mx-auto mt-6">
        <Lia size={80} mood="sleep" color="#A98BFF" />
        <h1 className="h1 mt-5">Hola{firstName ? `, ${firstName}` : ""}.</h1>
        <p className="text-muted mt-2">
          Tu cuenta está lista, pero aún no estás conectado a ningún equipo creativo. Pídele a tu freelancer o agencia
          que te registre como cliente con el correo <b className="text-ink">{profile.email}</b>.
        </p>
      </div>
    );
  }

  const [{ data: pending }, { data: quotes }, { data: invoices }] = await Promise.all([
    supabase.from("posts").select("*").eq("status", "en_revision").order("scheduled_at"),
    supabase.from("quotes").select("*, quote_items(quantity, unit_price)").eq("status", "enviada"),
    supabase.from("invoices").select("*, invoice_items(quantity, unit_price)").eq("status", "enviada").order("due_date"),
  ]);
  const posts = (pending ?? []) as Post[];
  const n = posts.length;
  const byBrief = new Map<string, number>();
  posts.forEach((p) => { if (p.brief_id) byBrief.set(p.brief_id, (byBrief.get(p.brief_id) ?? 0) + 1); });
  const { data: bd } = byBrief.size
    ? await supabase.from("briefs").select("id, title").in("id", [...byBrief.keys()])
    : { data: [] as { id: string; title: string }[] };
  const ready = (bd ?? []) as { id: string; title: string }[];

  return (
    <div className="space-y-9">
      <Hero>
        <div className="text-[13px] font-medium text-muted flex items-center gap-1.5">
          {workspaces.map(creativeName).join(", ")} <span>con</span> <Logo size={14} />
        </div>
        <h1 className="h1 mt-1">Hola{firstName ? `, ${firstName}` : ""}.</h1>
        <p className="text-[17px] leading-[26px] mt-1">
          {n > 0 ? <>Tienes <Trazo>{n} {n === 1 ? "pieza" : "piezas"}</Trazo> por aprobar</> : <>No tienes nada <Trazo>por aprobar</Trazo></>}
        </p>
      </Hero>

      <NotifyCard compact />

      {ready.length > 0 && (
        <Section title="Parrillas listas para aprobar" count={ready.length}>
          <RowList>
            {ready.map((r) => (
              <Row key={r.id} href={`/cliente/solicitudes/${r.id}`} status="en_revision" title={r.title}
                sub={`${byBrief.get(r.id)} ${byBrief.get(r.id) === 1 ? "pieza" : "piezas"} por aprobar`}
                pill={<span className="badge bg-azul-t text-brand-dark">Ver parrilla →</span>} />
            ))}
          </RowList>
        </Section>
      )}

      <Section title="Por aprobar" count={n}>
        {n ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {posts.map((p) => (
              <Link key={p.id} href={`/cliente/aprobaciones/${p.id}`} className="card overflow-hidden hover:bg-surface-2 transition-colors">
                {p.asset_url && !/\.(mp4|mov|webm)$/i.test(p.asset_url)
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={p.asset_url} alt="" className="w-full aspect-[4/3] object-cover bg-lila-t" />
                  : <div className="w-full aspect-[4/3] bg-azul-t flex items-center justify-center"><Lia size={56} mood="right" /></div>}
                <div className="p-4">
                  <div className="font-semibold truncate">{p.title}</div>
                  <div className="text-[13px] text-muted">{NETWORKS[p.network]} · {FORMATS[p.format]} · {p.scheduled_at ? fmtDateTime(p.scheduled_at) : "Sin fecha"}</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card flex items-center gap-4 px-5 py-6"><Lia size={44} mood="sleep" color="#A98BFF" /><span className="text-muted font-medium">Nada pendiente por hoy</span></div>
        )}
      </Section>

      {((quotes ?? []) as Quote[]).length > 0 && (
        <Section title="Cotizaciones por responder">
          <RowList>
            {((quotes ?? []) as Quote[]).map((q) => (
              <Row key={q.id} href={`/cliente/cotizaciones/${q.id}`} status="enviada" title={q.title} sub={`Cotización ${String(q.number).padStart(3, "0")}`} right={money(total(q.quote_items))} />
            ))}
          </RowList>
        </Section>
      )}

      {((invoices ?? []) as Invoice[]).length > 0 && (
        <Section title="Cuentas de cobro pendientes">
          <RowList>
            {((invoices ?? []) as Invoice[]).map((i) => (
              <Row key={i.id} href={`/cliente/cobros/${i.id}`} status="pendiente" title={`N.º ${String(i.number).padStart(3, "0")} · ${i.concept}`} sub={`Vence ${fmtDate(i.due_date)}`} right={money(total(i.invoice_items))} />
            ))}
          </RowList>
        </Section>
      )}
    </div>
  );
}
