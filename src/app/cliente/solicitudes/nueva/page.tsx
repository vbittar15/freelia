import { requireClient } from "@/lib/auth";
import { EmptyState, Field, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/client-ui";
import { FilePicker } from "@/components/file-picker";
import { createRequest } from "../../actions";
import { creativeName, getWorkspaces } from "../../data";

export const metadata = { title: "Nueva solicitud" };

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { supabase, user } = await requireClient();
  const ws = await getWorkspaces(supabase, user.id);
  if (!ws.length) return <EmptyState title="Aún no estás conectado a un equipo creativo" />;
  return (
    <>
      <PageHeader title="Nueva solicitud" subtitle="Cuéntale a tu equipo qué necesitas." back={{ href: "/cliente/solicitudes", label: "Solicitudes" }} />
      {error && <p className="mb-5 rounded-[18px] bg-rosa-t text-ink px-4 py-3 text-[14px]">{error}</p>}
      <form action={createRequest} className="card p-6 grid sm:grid-cols-2 gap-4 max-w-3xl">
        {ws.length > 1 ? (
          <Field label="Enviar a">
            <select name="client_id" className="input" required>
              {ws.map((w) => <option key={w.id} value={w.id}>{creativeName(w)}</option>)}
            </select>
          </Field>
        ) : <input type="hidden" name="client_id" value={ws[0].id} />}
        <Field label="¿Qué necesitas? *" className={ws.length > 1 ? "" : "sm:col-span-2"}>
          <input name="title" className="input" required placeholder="Ej. Piezas para el lanzamiento de diciembre" />
        </Field>
        <Field label="Objetivo" className="sm:col-span-2"><textarea name="objective" rows={3} className="input" placeholder="¿Qué quieres lograr?" /></Field>
        <Field label="¿A quién va dirigido?"><textarea name="audience" rows={3} className="input" /></Field>
        <Field label="Mensaje principal"><textarea name="key_message" rows={3} className="input" /></Field>
        <Field label="¿Qué piezas necesitas?" className="sm:col-span-2"><textarea name="deliverables" rows={3} className="input" placeholder="Ej. 4 posts, 2 historias, 1 video corto" /></Field>
        <Field label="Referencias o links" className="sm:col-span-2"><textarea name="refs" rows={2} className="input" /></Field>
        <div className="sm:col-span-2"><span className="label">Archivos (logos, referencias, audios…)</span><FilePicker userId={user.id} /></div>
        <Field label="¿Para cuándo?"><input name="deadline" type="date" className="input" /></Field>
        <div className="sm:col-span-2 flex justify-end"><SubmitButton pendingText="Enviando…">Enviar solicitud</SubmitButton></div>
      </form>
    </>
  );
}
