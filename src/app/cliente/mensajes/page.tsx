import { redirect } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { Avatar, EmptyState, PageHeader, Row, RowList } from "@/components/ui";
import { creativeName, getWorkspaces } from "../data";

export const metadata = { title: "Mensajes" };

export default async function Page() {
  const { supabase, user } = await requireClient();
  const ws = await getWorkspaces(supabase, user.id);
  if (ws.length === 1) redirect(`/cliente/mensajes/${ws[0].id}`);
  return (
    <>
      <PageHeader title="Mensajes" />
      {ws.length === 0 ? <EmptyState title="Aún no estás conectado a un equipo creativo" /> : (
        <RowList>
          {ws.map((w) => <Row key={w.id} href={`/cliente/mensajes/${w.id}`} icon={<Avatar name={creativeName(w)} size={40} />} title={creativeName(w)} />)}
        </RowList>
      )}
    </>
  );
}
