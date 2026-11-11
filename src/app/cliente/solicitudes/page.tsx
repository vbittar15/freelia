import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { EmptyState, PageHeader, Row, RowList, StatusBadge } from "@/components/ui";
import type { Brief } from "@/lib/types";
import { fmtDate } from "@/lib/utils";

export const metadata = { title: "Solicitudes" };

export default async function Page() {
  const { supabase } = await requireClient();
  const { data } = await supabase.from("briefs").select("*").order("created_at", { ascending: false });
  const briefs = (data ?? []) as Brief[];
  return (
    <>
      <PageHeader title="Pedidos" subtitle="Pide nuevos proyectos y revisa los briefs de tu equipo."
        actions={<Link href="/cliente/solicitudes/nueva" className="btn btn-primary">+ Nueva solicitud</Link>} />
      {briefs.length === 0 ? <EmptyState title="Sin solicitudes" text="¿Necesitas algo? Envía una solicitud y tu equipo creativo la recibirá al instante."
        action={<Link href="/cliente/solicitudes/nueva" className="btn btn-primary">Crear solicitud</Link>} /> : (
        <RowList>
          {briefs.map((b) => (
            <Row key={b.id} href={`/cliente/solicitudes/${b.id}`} status={b.status} title={b.title}
              sub={`Creado ${fmtDate(b.created_at)} · entrega ${fmtDate(b.deadline)}`} pill={<StatusBadge status={b.status} />} />
          ))}
        </RowList>
      )}
    </>
  );
}
