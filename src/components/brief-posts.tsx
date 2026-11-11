import type { Post } from "@/lib/types";
import { FORMATS, NETWORKS, fmtDateTime } from "@/lib/utils";
import { Row, StatusBadge } from "./ui";
import { STATES } from "./brand";

/** Progreso de la parrilla de un pedido: barra por estado + filas */
export function BriefProgress({ posts }: { posts: Post[] }) {
  const total = posts.length;
  const order = ["aprobado", "publicado", "en_revision", "cambios", "borrador"] as const;
  const counts = order.map((k) => [k, posts.filter((p) => p.status === k).length] as const).filter(([, n]) => n > 0);
  const done = posts.filter((p) => p.status === "aprobado" || p.status === "publicado").length;
  return (
    <div>
      <div className="flex items-end justify-between mb-2">
        <div className="text-[13px] text-muted font-medium">{done} de {total} {total === 1 ? "pieza aprobada" : "piezas aprobadas"}</div>
        <div className="text-[22px] font-bold tracking-tight">{total ? Math.round((done / total) * 100) : 0}%</div>
      </div>
      <div className="h-3 rounded-full bg-surface-2 overflow-hidden flex">
        {counts.map(([k, n]) => (
          <div key={k} className="h-full transition-[width] duration-700" style={{ width: `${(n / total) * 100}%`, background: STATES[k].dot }} title={`${STATES[k].label}: ${n}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[12px] text-muted">
        {counts.map(([k, n]) => (
          <span key={k} className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: STATES[k].dot }} />{STATES[k].label} · {n}</span>
        ))}
      </div>
    </div>
  );
}

export function BriefPostRows({ posts, hrefFor, actions }: { posts: Post[]; hrefFor: (p: Post) => string; actions?: (p: Post) => React.ReactNode }) {
  const sorted = [...posts].sort((a, b) => (a.scheduled_at ?? "9").localeCompare(b.scheduled_at ?? "9"));
  return (
    <div className="flex flex-col gap-2 stagger">
      {sorted.map((p) => (
        <div key={p.id} className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <Row href={hrefFor(p)} status={p.status} title={p.title}
              sub={`${NETWORKS[p.network] ?? p.network} · ${FORMATS[p.format] ?? p.format} · ${p.scheduled_at ? fmtDateTime(p.scheduled_at) : "Sin fecha"}`}
              pill={<StatusBadge status={p.status} />} />
          </div>
          {actions?.(p)}
        </div>
      ))}
    </div>
  );
}
