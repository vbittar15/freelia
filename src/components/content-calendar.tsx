import Link from "next/link";
import type { Post } from "@/lib/types";
import { clientLabel, cn, isoToBogotaLocal } from "@/lib/utils";

export const STATUS_DOT: Record<string, string> = {
  borrador: "#B7AFC5", en_revision: "#3D5BF5", cambios: "#FF7EB6", aprobado: "#2FBF7A", publicado: "#A98BFF",
};
const STATUS_TINT: Record<string, string> = {
  borrador: "#EFECF4", en_revision: "#DCE3FF", cambios: "#FFDCEB", aprobado: "#CDF2DF", publicado: "#E7DEFF",
};
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const fmtMonth = (yy: number, mm: number) => `${yy}-${String(mm).padStart(2, "0")}`;

/** Mes a mostrar (YYYY-MM) con sus límites en hora de Bogotá */
export function monthRange(mes?: string) {
  const todayLocal = isoToBogotaLocal(new Date().toISOString()).slice(0, 10);
  const [y, m] = (mes && /^\d{4}-\d{2}$/.test(mes) ? mes : todayLocal.slice(0, 7)).split("-").map(Number);
  return {
    y, m, todayLocal,
    start: new Date(Date.UTC(y, m - 1, 1, 5)).toISOString(),
    end: new Date(Date.UTC(y, m, 1, 5)).toISOString(),
    prev: m === 1 ? fmtMonth(y - 1, 12) : fmtMonth(y, m - 1),
    next: m === 12 ? fmtMonth(y + 1, 1) : fmtMonth(y, m + 1),
  };
}

export function ContentCalendar({ posts, undated = [], mes, monthHref, newHref, showClient = true }: {
  posts: Post[]; undated?: Post[]; mes?: string;
  monthHref: (mes?: string) => string; newHref: (day: string) => string; showClient?: boolean;
}) {
  const { y, m, todayLocal, prev, next } = monthRange(mes);
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
      <div className="flex items-center justify-between mb-3">
        <h2 className="h2 first-letter:uppercase">{monthName}</h2>
        <div className="flex gap-1">
          <Link href={monthHref(prev)} className="btn btn-ghost btn-sm" aria-label="Mes anterior">←</Link>
          <Link href={monthHref(undefined)} className="btn btn-ghost btn-sm">Hoy</Link>
          <Link href={monthHref(next)} className="btn btn-ghost btn-sm" aria-label="Mes siguiente">→</Link>
        </div>
      </div>
      <div className="rounded-[22px] border border-line overflow-hidden">
        <div className="grid grid-cols-7 border-b border-line bg-surface">
          {WEEKDAYS.map((d) => <div key={d} className="px-2 py-2 text-[11px] text-muted text-center">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => (
            <div key={i} className={cn("min-h-[64px] sm:min-h-[120px] border-b border-r border-line p-1.5 sm:p-2 group min-w-0",
              (i + 1) % 7 === 0 && "border-r-0", !day && "bg-surface/40")}>
              {day && (
                <>
                  <div className="flex items-center justify-between">
                    <span className={cn("text-[11px] size-6 inline-flex items-center justify-center rounded-full",
                      day === todayLocal ? "bg-brand text-white font-semibold" : "text-muted font-medium")}>{Number(day.slice(8))}</span>
                    <Link href={newHref(day)} className="opacity-0 group-hover:opacity-100 text-brand text-[16px] leading-none px-1" aria-label="Agregar pieza">+</Link>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1 sm:hidden">
                    {(byDay.get(day) ?? []).map((p) => (
                      <Link key={p.id} href={`/panel/parrilla/${p.id}`} aria-label={p.title} className="size-2.5 rounded-full" style={{ background: STATUS_DOT[p.status] }} />
                    ))}
                  </div>
                  <div className="mt-1 space-y-1 hidden sm:block">
                    {(byDay.get(day) ?? []).map((p) => (
                      <Link key={p.id} href={`/panel/parrilla/${p.id}`} title={showClient ? `${p.title} · ${clientLabel(p.clients)}` : p.title}
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
      {posts.length > 0 && (
        <div className="sm:hidden mt-6">
          <h3 className="h2 mb-3">Este mes</h3>
          <div className="flex flex-col gap-2 stagger">
            {[...posts].sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? "")).map((p) => (
              <Link key={p.id} href={`/panel/parrilla/${p.id}`} className="flex items-center gap-3 bg-surface rounded-[18px] px-3.5 py-3">
                <span className="w-9 text-center shrink-0"><span className="block text-[17px] font-bold leading-none">{Number(isoToBogotaLocal(p.scheduled_at).slice(8, 10))}</span><span className="text-[10px] text-muted">{["dom", "lun", "mar", "mié", "jue", "vie", "sáb"][new Date(isoToBogotaLocal(p.scheduled_at).slice(0, 10) + "T12:00:00").getDay()]}</span></span>
                <span className="size-2 rounded-full shrink-0" style={{ background: STATUS_DOT[p.status] }} />
                <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold truncate">{p.title}</span>{showClient && <span className="block text-[12px] text-muted truncate">{clientLabel(p.clients)}</span>}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
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
  );
}
