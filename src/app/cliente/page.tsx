import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { Lia } from "@/components/brand";
import { Section, Stat, StatusBadge } from "@/components/ui";
import type { Invoice, Post, Quote } from "@/lib/types";
import { NETWORKS, fmtDate, fmtDateTime, money, total } from "@/lib/utils";
import { creativeName, getWorkspaces } from "./data";

export const metadata = { title: "Inicio" };

export default async function Page() {
  const { supabase, user, profile } = await requireClient();
  const workspaces = await getWorkspaces(supabase, user.id);
  const firstName = (profile.full_name ?? "").split(" ")[0];

  if (workspaces.length === 0) {
    return (
      <div className="card flex flex-col items-center text-center px-6 py-16 max-w-xl mx-auto">
        <Lia size={64} mood="calm" />
        <h1 className="mt-5 text-[20px] font-semibold">Hola{firstName ? `, ${firstName}` : ""}</h1>
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
  const owed = ((invoices ?? []) as Invoice[]).reduce((s, i) => s + total(i.invoice_items), 0);

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-4">
        <Lia size={48} mood="wink" />
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Hola{firstName ? `, ${firstName}` : ""}</h1>
          <p className="text-muted">Trabajando con {workspaces.map(creativeName).join(", ")}.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Stat label="Piezas por aprobar" value={pending?.length ?? 0} tone="mantequilla" href="/cliente/aprobaciones" />
        <Stat label="Cotizaciones por responder" value={quotes?.length ?? 0} tone="cielo" href="/cliente/cotizaciones" />
        <Stat label="Pendiente de pago" value={money(owed)} tone="menta" href="/cliente/cobros" />
      </div>

      <Section title="Esperan tu aprobación">
        {(pending as Post[] | null)?.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(pending as Post[]).map((p) => (
              <Link key={p.id} href={`/cliente/aprobaciones/${p.id}`} className="card overflow-hidden hover:border-brand/40">
                {p.asset_url && !/\.(mp4|mov|webm)$/i.test(p.asset_url)
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={p.asset_url} alt="" className="w-full aspect-[4/3] object-cover bg-surface" />
                  : <div className="w-full aspect-[4/3] bg-lavanda flex items-center justify-center text-muted text-[12px]">{NETWORKS[p.network]}</div>}
                <div className="p-4">
                  <div className="font-medium truncate">{p.title}</div>
                  <div className="text-[12px] text-muted">{NETWORKS[p.network]} · {p.scheduled_at ? fmtDateTime(p.scheduled_at) : "Sin fecha"}</div>
                </div>
              </Link>
            ))}
          </div>
        ) : <div className="card px-5 py-8 text-center text-muted">No tienes piezas pendientes. ✨</div>}
      </Section>

      {(quotes as Quote[] | null)?.length ? (
        <Section title="Cotizaciones por responder">
          <div className="card divide-y divide-line">
            {(quotes as Quote[]).map((q) => (
              <Link key={q.id} href={`/cliente/cotizaciones/${q.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface/60">
                <div className="flex-1 min-w-0 font-medium truncate">#{q.number} · {q.title}</div>
                <div className="font-medium">{money(total(q.quote_items))}</div>
                <StatusBadge status="enviada" label="Por responder" />
              </Link>
            ))}
          </div>
        </Section>
      ) : null}

      {(invoices as Invoice[] | null)?.length ? (
        <Section title="Cuentas de cobro pendientes">
          <div className="card divide-y divide-line">
            {(invoices as Invoice[]).map((i) => (
              <Link key={i.id} href={`/cliente/cobros/${i.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface/60">
                <div className="flex-1 min-w-0"><div className="font-medium truncate">N.º {i.number} · {i.concept}</div>
                  <div className="text-[12px] text-muted">Vence {fmtDate(i.due_date)}</div></div>
                <div className="font-medium">{money(total(i.invoice_items))}</div>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}
