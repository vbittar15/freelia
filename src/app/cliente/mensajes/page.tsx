import Link from "next/link";
import { redirect } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { Avatar, EmptyState, PageHeader } from "@/components/ui";
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
        <div className="card divide-y divide-line">
          {ws.map((w) => (
            <Link key={w.id} href={`/cliente/mensajes/${w.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-surface/60">
              <Avatar name={creativeName(w)} size={40} /><span className="font-medium">{creativeName(w)}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
