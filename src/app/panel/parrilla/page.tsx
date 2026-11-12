import Link from "next/link";
import { requireCreative } from "@/lib/auth";
import { EmptyState, PageHeader, Row, RowList, StatusBadge } from "@/components/ui";
import { Icon } from "@/components/icons";
import { hasModule } from "@/lib/modules";
import type { Client, Post } from "@/lib/types";
import { NETWORKS, FORMATS, clientLabel, cn, fmtDateTime } from "@/lib/utils";
import { ContentCalendar, monthRange } from "@/components/content-calendar";
import { pieceWord, usesSocial, workTitle } from "@/lib/rubros";

export const metadata = { title: "Parrilla" };

type SP = { mes?: string; cliente?: string; estado?: string; vista?: string };

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { supabase, profile } = await requireCreative();
  const { data: pcs } = await supabase.from("clients").select("id, name, company, color, logo_url, modules").eq("archived", false).order("company");
  const parrillaClients = ((pcs ?? []) as Client[]).filter((c) => hasModule(c, "parrilla"));
  const rub = profile.specialties ?? [];

  const { start, end } = monthRange(sp.mes);
  const list = sp.vista === "lista";

  const qs = (patch: Partial<SP>) => {
    const p = new URLSearchParams();
    const merged = { ...sp, ...patch };
    Object.entries(merged).forEach(([k, v]) => v && p.set(k, v));
    return `/panel/parrilla?${p.toString()}`;
  };

  const { data: clients } = await supabase.from("clients").select("id, name, company").eq("archived", false).order("company");

  let q = supabase.from("posts").select("*, clients(name, company, color)");
  if (sp.cliente) q = q.eq("client_id", sp.cliente);
  if (sp.estado) q = q.eq("status", sp.estado);
  if (!list) q = q.gte("scheduled_at", start).lt("scheduled_at", end);
  const { data } = await q.order("scheduled_at", { ascending: !list, nullsFirst: true });
  const posts = (data ?? []) as Post[];

  let undated: Post[] = [];
  if (!list) {
    let uq = supabase.from("posts").select("*, clients(name, company, color)").is("scheduled_at", null);
    if (sp.cliente) uq = uq.eq("client_id", sp.cliente);
    if (sp.estado) uq = uq.eq("status", sp.estado);
    undated = ((await uq).data ?? []) as Post[];
  }

  return (
    <>
      <PageHeader title={workTitle(rub)} subtitle={usesSocial(rub) ? "Planea, envía a aprobación y publica." : "Organiza tus entregas, envíalas a aprobación y entrégalas."}
        actions={<>
          <Link href={`/panel/enviar${sp.cliente ? `?cliente=${sp.cliente}` : ""}`} className="btn btn-soft">Enviar a revisión</Link>
          <Link href={`/panel/parrilla/nueva${sp.cliente ? `?cliente=${sp.cliente}` : ""}`} className="btn btn-primary">+ Nueva {pieceWord(rub)}</Link>
        </>} />

      {parrillaClients.length > 0 && (
        <section className="mb-6">
          <div className="text-[13px] font-semibold text-muted mb-2 px-1">Parrilla de cada cliente</div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {parrillaClients.map((c) => (
              <Link key={c.id} href={`/panel/clientes/${c.id}?tab=parrilla`} className="shrink-0 flex items-center gap-2.5 rounded-[18px] bg-surface hover:bg-surface-2 px-3 py-2.5 transition-colors">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {c.logo_url ? <img src={c.logo_url} alt="" className="size-8 rounded-[10px] object-contain bg-white" /> : <span className="size-8 rounded-[10px] grid place-items-center text-[12px] font-bold" style={{ background: c.color ?? "#DCE3FF" }}>{(c.company || c.name).slice(0, 2).toUpperCase()}</span>}
                <span className="font-semibold text-[14px] whitespace-nowrap">{c.company || c.name}</span>
                <Icon name="chevronRight" className="size-4 text-faint" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <form className="flex flex-wrap gap-2" action="/panel/parrilla">
          {sp.mes && <input type="hidden" name="mes" value={sp.mes} />}
          {sp.vista && <input type="hidden" name="vista" value={sp.vista} />}
          <select name="cliente" defaultValue={sp.cliente ?? ""} className="input h-10 w-auto text-[14px] bg-surface">
            <option value="">Todos los clientes</option>
            {(clients ?? []).map((c) => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
          </select>
          <select name="estado" defaultValue={sp.estado ?? ""} className="input h-10 w-auto text-[14px] bg-surface">
            <option value="">Todos los estados</option>
            <option value="borrador">Borrador</option><option value="en_revision">En revisión</option>
            <option value="cambios">Cambios pedidos</option><option value="aprobado">Aprobado</option><option value="publicado">Publicado</option>
          </select>
          <button className="btn btn-soft btn-sm h-10">Filtrar</button>
        </form>
        <div className="ml-auto flex rounded-full bg-surface p-1">
          <Link href={qs({ vista: undefined })} className={cn("btn btn-sm", !list ? "bg-white shadow-sm text-ink" : "text-muted font-medium")}>Calendario</Link>
          <Link href={qs({ vista: "lista" })} className={cn("btn btn-sm", list ? "bg-white shadow-sm text-ink" : "text-muted font-medium")}>Lista</Link>
        </div>
      </div>

      {list ? (
        <RowList empty={<EmptyState title="No hay piezas" text="Crea tu primera pieza para empezar la parrilla." />}>
          {posts.map((p) => (
            <Row key={p.id} href={`/panel/parrilla/${p.id}`} status={p.status} title={p.title}
              sub={`${clientLabel(p.clients)} · ${NETWORKS[p.network] ?? p.network} · ${FORMATS[p.format] ?? p.format} · ${p.scheduled_at ? fmtDateTime(p.scheduled_at) : "Sin fecha"}`}
              pill={<StatusBadge status={p.status} />} />
          ))}
        </RowList>
      ) : (
        <ContentCalendar posts={posts} undated={undated} mes={sp.mes}
          monthHref={(mes) => qs({ mes })}
          newHref={(day) => `/panel/parrilla/nueva?fecha=${day}${sp.cliente ? `&cliente=${sp.cliente}` : ""}`} />
      )}
    </>
  );
}
