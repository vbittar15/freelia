import Link from "next/link";
import { requireCreative } from "@/lib/auth";
import { EmptyState, PageHeader, Row, RowList, StatusBadge } from "@/components/ui";
import type { Post } from "@/lib/types";
import { NETWORKS, FORMATS, clientLabel, cn, fmtDateTime, isoToBogotaLocal } from "@/lib/utils";

export const metadata = { title: "Parrilla" };

const STATUS_DOT: Record<string, string> = {
  borrador: "#B7AFC5", en_revision: "#3D5BF5", cambios: "#FF7EB6", aprobado: "#2FBF7A", publicado: "#A98BFF",
};
const STATUS_TINT: Record<string, string> = {
  borrador: "#EFECF4", en_revision: "#DCE3FF", cambios: "#FFDCEB", aprobado: "#CDF2DF", publicado: "#E7DEFF",
};
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

type SP = { mes?: string; cliente?: string; estado?: string; vista?: string };

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { supabase } = await requireCreative();

  const todayLocal = isoToBogotaLocal(new Date().toISOString()).slice(0, 10);
  const [y, m] = (sp.mes && /^\d{4}-\d{2}$/.test(sp.mes) ? sp.mes : todayLocal.slice(0, 7)).split("-").map(Number);
  const monthStart = new Date(Date.UTC(y, m - 1, 1, 5)); // 00:00 Bogotá
  const monthEnd = new Date(Date.UTC(y, m, 1, 5));
  const fmtMonth = (yy: number, mm: number) => `${yy}-${String(mm).padStart(2, "0")}`;
  const prev = m === 1 ? fmtMonth(y - 1, 12) : fmtMonth(y, m - 1);
  const next = m === 12 ? fmtMonth(y + 1, 1) : fmtMonth(y, m + 1);
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
  if (!list) q = q.gte("scheduled_at", monthStart.toISOString()).lt("scheduled_at", monthEnd.toISOString());
  const { data } = await q.order("scheduled_at", { ascending: !list, nullsFirst: true });
  const posts = (data ?? []) as Post[];

  let undated: Post[] = [];
  if (!list) {
    let uq = supabase.from("posts").select("*, clients(name, company, color)").is("scheduled_at", null);
    if (sp.cliente) uq = uq.eq("client_id", sp.cliente);
    if (sp.estado) uq = uq.eq("status", sp.estado);
    undated = ((await uq).data ?? []) as Post[];
  }

  // Construcción del calendario (semanas que empiezan en lunes)
  const firstWeekday = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${fmtMonth(y, m)}-${String(i + 1).padStart(2, "0")}`),
  ];
  while (cells.length % 7) cells.push(null);
  const byDay = new Map<string, Post[]>();
  posts.forEach((p) => {
    const k = isoToBogotaLocal(p.scheduled_at).slice(0, 10);
    byDay.set(k, [...(byDay.get(k) ?? []), p]);
  });
  const monthName = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 15)));

  return (
    <>
      <PageHeader title="Parrilla de contenido" subtitle="Planea, envía a aprobación y publica."
        actions={<Link href={`/panel/parrilla/nueva${sp.cliente ? `?cliente=${sp.cliente}` : ""}`} className="btn btn-primary">+ Nueva pieza</Link>} />

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
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="h2 first-letter:uppercase">{monthName}</h2>
            <div className="flex gap-1">
              <Link href={qs({ mes: prev })} className="btn btn-ghost btn-sm" aria-label="Mes anterior">←</Link>
              <Link href={qs({ mes: undefined })} className="btn btn-ghost btn-sm">Hoy</Link>
              <Link href={qs({ mes: next })} className="btn btn-ghost btn-sm" aria-label="Mes siguiente">→</Link>
            </div>
          </div>
          <div className="rounded-[22px] border border-line overflow-hidden">
            <div className="grid grid-cols-7 border-b border-line bg-surface">
              {WEEKDAYS.map((d) => <div key={d} className="px-2 py-2 text-[11px] text-muted text-center">{d}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((day, i) => (
                <div key={i} className={cn("min-h-[92px] sm:min-h-[120px] border-b border-r border-line p-1.5 sm:p-2 group",
                  (i + 1) % 7 === 0 && "border-r-0", !day && "bg-surface/40")}>
                  {day && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className={cn("text-[11px] size-6 inline-flex items-center justify-center rounded-full",
                          day === todayLocal ? "bg-brand text-white font-semibold" : "text-muted font-medium")}>{Number(day.slice(8))}</span>
                        <Link href={`/panel/parrilla/nueva?fecha=${day}${sp.cliente ? `&cliente=${sp.cliente}` : ""}`}
                          className="opacity-0 group-hover:opacity-100 text-brand text-[14px] leading-none px-1" aria-label="Agregar">+</Link>
                      </div>
                      <div className="mt-1 space-y-1">
                        {(byDay.get(day) ?? []).map((p) => (
                          <Link key={p.id} href={`/panel/parrilla/${p.id}`} title={`${p.title} · ${clientLabel(p.clients)}`}
                            className="block rounded-lg px-1.5 py-1 text-[10.5px] sm:text-[11px] font-medium leading-tight truncate hover:ring-1 ring-brand/30"
                            style={{ background: STATUS_TINT[p.status] }}>
                            <span className="inline-block size-1.5 rounded-full mr-1 align-middle" style={{ background: STATUS_DOT[p.status] }} />
                            {p.title}
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-muted">
            {Object.entries(STATUS_DOT).map(([k, c]) => (
              <span key={k} className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: c }} />
                {{ borrador: "Borrador", en_revision: "En revisión", cambios: "Cambios", aprobado: "Aprobado", publicado: "Publicado" }[k]}</span>
            ))}
          </div>
          {undated.length > 0 && (
            <div className="mt-8">
              <h3 className="h2 mb-3">Sin fecha</h3>
              <div className="flex flex-wrap gap-2">
                {undated.map((p) => (
                  <Link key={p.id} href={`/panel/parrilla/${p.id}`} className="card px-3.5 py-2 text-[13px] font-medium hover:bg-surface-2 flex items-center gap-2">
                    <span className="size-1.5 rounded-full" style={{ background: STATUS_DOT[p.status] }} />{p.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
