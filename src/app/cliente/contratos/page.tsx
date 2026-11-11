import { requireClient } from "@/lib/auth";
import { EmptyState, PageHeader, Row, RowList, StatusBadge } from "@/components/ui";
import type { Contract } from "@/lib/types";
import { fmtDate } from "@/lib/utils";

export const metadata = { title: "Contratos" };

export default async function Page() {
  const { supabase } = await requireClient();
  const { data } = await supabase.from("contracts").select("id, number, title, status, sent_at, signed_at").order("created_at", { ascending: false });
  const list = (data ?? []) as Pick<Contract, "id" | "number" | "title" | "status" | "sent_at" | "signed_at">[];
  return (
    <>
      <PageHeader title="Contratos" subtitle="Revisa y firma tus contratos desde aquí." />
      <RowList empty={<EmptyState title="No tienes contratos" text="Cuando tu equipo creativo te envíe un contrato, podrás firmarlo aquí." />}>
        {list.map((k) => (
          <Row key={k.id} href={`/cliente/contratos/${k.id}`} status={k.status === "firmado" ? "aprobado" : "en_revision"} title={k.title}
            sub={k.signed_at ? `Firmado el ${fmtDate(k.signed_at)}` : `Recibido el ${fmtDate(k.sent_at)}`}
            pill={<StatusBadge status={k.status === "firmado" ? "aprobado" : k.status === "anulado" ? "rechazada" : "en_revision"} label={k.status === "firmado" ? "Firmado" : k.status === "anulado" ? "Anulado" : "Por firmar"} />} />
        ))}
      </RowList>
    </>
  );
}
