import { requireClient } from "@/lib/auth";
import { EmptyState, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/client-ui";
import { FilePicker } from "@/components/file-picker";
import { KindPicker, RequestFields } from "@/components/request-fields";
import { Lia } from "@/components/brand";
import { kindMap } from "@/lib/requests";
import { createRequest } from "../../actions";
import { creativeName, getWorkspaces } from "../../data";
import { Icon, IconTile } from "@/components/icons";

export const metadata = { title: "Nueva solicitud" };

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; tipo?: string }> }) {
  const { error, tipo } = await searchParams;
  const { supabase, user } = await requireClient();
  const ws = await getWorkspaces(supabase, user.id);
  if (!ws.length) return <EmptyState title="Aún no estás conectado a un equipo creativo" />;
  const kind = tipo ? kindMap[tipo] : undefined;
  return (
    <>
      <PageHeader title="Nueva solicitud" subtitle={kind ? undefined : "¿Qué necesitas de tu equipo creativo?"} back={{ href: "/cliente/solicitudes", label: "Solicitudes" }} />
      {error && <p className="mb-5 rounded-[18px] bg-rosa-t text-ink px-4 py-3 text-[14px]">{error}</p>}
      <KindPicker current={kind?.key} href={(k) => `/cliente/solicitudes/nueva?tipo=${k}`} />
      {kind ? (
        <form action={createRequest} className="card p-5 sm:p-6 grid sm:grid-cols-2 gap-4 max-w-3xl mt-6 anim-page">
          <div className="sm:col-span-2 flex items-center gap-3">
            <IconTile name={kind.icon} tint={kind.tint} size={44} />
            <div><div className="font-semibold text-[17px]">{kind.label}</div><div className="text-[13px] text-muted">{kind.desc}</div></div>
          </div>
          {ws.length > 1 ? (
            <label className="block sm:col-span-2"><span className="label">Enviar a</span>
              <select name="client_id" className="input" required>
                {ws.map((w) => <option key={w.id} value={w.id}>{creativeName(w)}</option>)}
              </select></label>
          ) : <input type="hidden" name="client_id" value={ws[0].id} />}
          <RequestFields kind={kind} />
          {kind.files && <div className="sm:col-span-2"><span className="label">Archivos (logos, referencias, fotos…)</span><FilePicker userId={user.id} /></div>}
          <div className="sm:col-span-2 flex flex-col-reverse sm:flex-row sm:items-center gap-3 justify-between">
            <span className="text-[13px] text-muted">{kind.key === "reunion" ? `${creativeName(ws[0])} te confirmará la fecha y el enlace.` : `${creativeName(ws[0])} recibe un aviso al instante.`}</span>
            <SubmitButton pendingText="Enviando…">{kind.key === "reunion" ? "Pedir reunión" : "Enviar solicitud"}</SubmitButton>
          </div>
        </form>
      ) : (
        <div className="mt-6 flex items-center gap-3 rounded-[20px] bg-azul-t p-4 max-w-xl">
          <Lia size={40} mood="smile" />
          <p className="text-[14px]">Elige qué necesitas y te pido solo los datos justos para ese tipo de solicitud.</p>
        </div>
      )}
    </>
  );
}
