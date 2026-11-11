import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import type { Brief } from "@/lib/types";
import { fmtDate } from "@/lib/utils";

export const metadata = { title: "Solicitudes" };

export default async function Page() {
  const { supabase } = await requireClient();
  const { data } = await supabase.from("briefs").select("*").order("created_at", { ascending: false });
  const briefs = (data ?? []) as Brief[];
  return (
    <>
      <PageHeader title="Solicitudes y briefs" subtitle="Pide nuevos proyectos y revisa los briefs de tu equipo."
        actions={<Link href="/cliente/solicitudes/nueva" className="btn btn-primary">+ Nueva solicitud</Link>} />
      {briefs.length === 0 ? <EmptyState title="Sin solicitudes" text="¿Necesitas algo? Envía una solicitud y tu equipo creativo la recibirá al instante."
        action={<Link href="/cliente/solicitudes/nueva" className="btn btn-primary">Crear solicitud</Link>} /> : (
        <div className="card divide-y divide-line">
          {briefs.map((b) => (
            <Link key={b.id} href={`/cliente/solicitudes/${b.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-surface/60">
              <div className="flex-1 min-w-0"><div className="font-medium truncate">{b.title}</div>
                <div className="text-[12px] text-muted">Creado {fmtDate(b.created_at)} · entrega {fmtDate(b.deadline)}</div></div>
              <StatusBadge status={b.status} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
