import { SubmitButton } from "@/components/client-ui";
import { Field } from "@/components/ui";
import { ItemsEditor } from "@/components/items-editor";
import { ImageUpload } from "@/components/image-upload";
import { FilePicker } from "@/components/file-picker";
import type { Brief, Client, Invoice, Post, Quote } from "@/lib/types";
import { FORMATS, NETWORKS, isoToBogotaLocal } from "@/lib/utils";
import { saveBrief, saveClient, saveInvoice, savePost, saveQuote } from "./actions";

export function ErrorNote({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="mb-5 rounded-[18px] bg-rosa-t text-ink px-4 py-3 text-[14px]">{error}</p>;
}

type ClientOpt = Pick<Client, "id" | "name" | "company">;

function ClientSelect({ clients, value, disabled }: { clients: ClientOpt[]; value?: string; disabled?: boolean }) {
  return (
    <Field label="Cliente">
      <select name="client_id" className="input" defaultValue={value ?? ""} required disabled={disabled}>
        <option value="" disabled>Elige un cliente</option>
        {clients.map((c) => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
      </select>
      {disabled && <input type="hidden" name="client_id" value={value} />}
    </Field>
  );
}

const SWATCHES = ["#C9D6FF", "#E2D9FF", "#CFEFDF", "#FFE9B8", "#FFD3E4", "#D4ECFF", "#E9E3D6"];

export function ClientForm({ client }: { client?: Client }) {
  return (
    <form action={saveClient} className="card p-6 grid sm:grid-cols-2 gap-4 max-w-3xl">
      {client && <input type="hidden" name="id" value={client.id} />}
      <Field label="Nombre de contacto *"><input name="name" className="input" required defaultValue={client?.name} /></Field>
      <Field label="Marca / empresa"><input name="company" className="input" defaultValue={client?.company ?? ""} /></Field>
      <Field label="Correo" hint="Para enviarle la invitación por correo.">
        <input name="email" type="email" className="input" defaultValue={client?.email ?? ""} />
      </Field>
      <Field label="WhatsApp" hint="Para enviarle la invitación por WhatsApp."><input name="phone" className="input" defaultValue={client?.phone ?? ""} placeholder="300 123 4567" /></Field>
      <Field label="NIT o cédula"><input name="document_id" className="input" defaultValue={client?.document_id ?? ""} /></Field>
      <div>
        <span className="label">Color</span>
        <div className="flex gap-2 h-10 items-center">
          {SWATCHES.map((c, i) => (
            <label key={c} className="cursor-pointer">
              <input type="radio" name="color" value={c} className="peer sr-only"
                defaultChecked={client ? client.color === c : i === 0} />
              <span className="block size-7 rounded-full ring-offset-2 peer-checked:ring-2 ring-brand" style={{ background: c }} />
            </label>
          ))}
        </div>
      </div>
      <Field label="Notas internas" className="sm:col-span-2">
        <textarea name="notes" rows={3} className="input" defaultValue={client?.notes ?? ""} placeholder="Tono de marca, horarios, personas clave…" />
      </Field>
      <div className="sm:col-span-2 flex justify-end">
        <SubmitButton>{client ? "Guardar cambios" : "Crear cliente"}</SubmitButton>
      </div>
    </form>
  );
}

export function BriefForm({ brief, clients, clientId, userId }: { brief?: Brief; clients: ClientOpt[]; clientId?: string; userId: string }) {
  return (
    <form action={saveBrief} className="card p-6 grid sm:grid-cols-2 gap-4 max-w-3xl">
      {brief && <input type="hidden" name="id" value={brief.id} />}
      <ClientSelect clients={clients} value={brief?.client_id ?? clientId} disabled={!!brief} />
      <Field label="Título del proyecto *"><input name="title" className="input" required defaultValue={brief?.title} placeholder="Ej. Campaña de Navidad" /></Field>
      <Field label="Objetivo" className="sm:col-span-2"><textarea name="objective" rows={3} className="input" defaultValue={brief?.objective ?? ""} placeholder="¿Qué queremos lograr?" /></Field>
      <Field label="Público objetivo"><textarea name="audience" rows={3} className="input" defaultValue={brief?.audience ?? ""} /></Field>
      <Field label="Mensaje clave"><textarea name="key_message" rows={3} className="input" defaultValue={brief?.key_message ?? ""} /></Field>
      <Field label="Entregables" className="sm:col-span-2"><textarea name="deliverables" rows={3} className="input" defaultValue={brief?.deliverables ?? ""} placeholder="Ej. 8 posts, 4 reels, 1 landing" /></Field>
      <Field label="Referencias / links" className="sm:col-span-2"><textarea name="refs" rows={2} className="input" defaultValue={brief?.refs ?? ""} /></Field>
      <div className="sm:col-span-2"><span className="label">Archivos</span><FilePicker userId={userId} initial={brief?.attachments ?? []} /></div>
      <Field label="Fecha de entrega"><input name="deadline" type="date" className="input" defaultValue={brief?.deadline ?? ""} /></Field>
      <Field label="Presupuesto (COP)"><input name="budget" type="number" min="0" step="1000" className="input" defaultValue={brief?.budget ?? ""} /></Field>
      <div className="sm:col-span-2 flex justify-end">
        <SubmitButton>{brief ? "Guardar cambios" : "Crear brief"}</SubmitButton>
      </div>
    </form>
  );
}

type BriefOpt = { id: string; title: string; client_id: string };

export function PostForm({ post, clients, userId, clientId, date, briefs = [], briefId }: { post?: Post; clients: ClientOpt[]; userId: string; clientId?: string; date?: string; briefs?: BriefOpt[]; briefId?: string }) {
  const cid = post?.client_id ?? clientId;
  const briefOpts = briefs.filter((b) => !cid || b.client_id === cid);
  const canSend = !post || post.status === "borrador" || post.status === "cambios";
  return (
    <form action={savePost} className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-5">
      {post && <input type="hidden" name="id" value={post.id} />}
      <div className="card p-6 space-y-4">
        <Field label="Título de la pieza *"><input name="title" className="input" required defaultValue={post?.title} placeholder="Ej. Lanzamiento sabor maracuyá" /></Field>
        <Field label="Copy"><textarea name="copy" rows={8} className="input" defaultValue={post?.copy ?? ""} placeholder="Texto de la publicación, hashtags, CTA…" /></Field>
        <div>
          <span className="label">Arte</span>
          <ImageUpload userId={userId} initial={post?.asset_url} />
        </div>
      </div>
      <div className="space-y-4">
        <div className="card p-6 space-y-4">
          <ClientSelect clients={clients} value={post?.client_id ?? clientId} disabled={!!post} />
          <Field label="Red">
            <select name="network" className="input" defaultValue={post?.network ?? "instagram"}>
              {Object.entries(NETWORKS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Formato">
            <select name="format" className="input" defaultValue={post?.format ?? "post"}>
              {Object.entries(FORMATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Fecha y hora de publicación">
            <input name="scheduled_at" type="datetime-local" className="input"
              defaultValue={post ? isoToBogotaLocal(post.scheduled_at) : date ? `${date}T10:00` : ""} />
          </Field>
          {briefOpts.length > 0 && (
            <Field label="Pedido / brief" hint="Agrupa la pieza en la parrilla de un pedido del cliente.">
              <select name="brief_id" className="input" defaultValue={post?.brief_id ?? briefId ?? ""}>
                <option value="">Sin pedido</option>
                {briefOpts.map((b) => <option key={b.id} value={b.id}>{!cid ? `${clients.find((c) => c.id === b.client_id)?.company || clients.find((c) => c.id === b.client_id)?.name || "Cliente"} · ` : ""}{b.title}</option>)}
              </select>
            </Field>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <SubmitButton name="intent" value="save">{post?.status === "cambios" ? "Guardar corrección" : post ? "Guardar cambios" : "Guardar pieza"}</SubmitButton>
          {canSend && (
            <SubmitButton className="btn btn-soft" name="intent" value="review" pendingText="Guardando…">
              {post?.status === "cambios" ? "Guardar y reenviar →" : "Guardar y enviar a aprobación →"}
            </SubmitButton>
          )}
          {canSend && <p className="text-[12px] text-muted text-center px-2">Tip: guarda varias piezas y envíalas juntas. Tu cliente recibe un solo aviso.</p>}
        </div>
      </div>
    </form>
  );
}

export function QuoteForm({ quote, clients, clientId }: { quote?: Quote; clients: ClientOpt[]; clientId?: string }) {
  return (
    <form action={saveQuote} className="space-y-5 max-w-4xl">
      {quote && <input type="hidden" name="id" value={quote.id} />}
      <div className="card p-6 grid sm:grid-cols-2 gap-4">
        <ClientSelect clients={clients} value={quote?.client_id ?? clientId} disabled={!!quote} />
        <Field label="Título *"><input name="title" className="input" required defaultValue={quote?.title} placeholder="Ej. Gestión de redes – diciembre" /></Field>
        <Field label="Válida hasta"><input name="valid_until" type="date" className="input" defaultValue={quote?.valid_until ?? ""} /></Field>
      </div>
      <div className="card p-6">
        <h3 className="font-medium mb-4">Ítems</h3>
        <ItemsEditor initial={quote?.quote_items} />
      </div>
      <div className="card p-6">
        <Field label="Condiciones / notas">
          <textarea name="notes" rows={4} className="input" defaultValue={quote?.notes ?? "50% de anticipo para iniciar y 50% contra entrega.\nIncluye 2 rondas de ajustes."} />
        </Field>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <SubmitButton className="btn btn-soft" name="intent" value="save">Guardar borrador</SubmitButton>
        <SubmitButton name="intent" value="send" pendingText="Enviando…">Guardar y enviar al cliente</SubmitButton>
      </div>
    </form>
  );
}

export function InvoiceForm({ invoice, clients, clientId }: { invoice?: Invoice; clients: ClientOpt[]; clientId?: string }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={saveInvoice} className="space-y-5 max-w-4xl">
      {invoice && <input type="hidden" name="id" value={invoice.id} />}
      <div className="card p-6 grid sm:grid-cols-2 gap-4">
        <ClientSelect clients={clients} value={invoice?.client_id ?? clientId} disabled={!!invoice} />
        <Field label="Por concepto de *"><input name="concept" className="input" required defaultValue={invoice?.concept} placeholder="Ej. Servicios de diseño – noviembre" /></Field>
        <Field label="Fecha de emisión"><input name="issue_date" type="date" className="input" defaultValue={invoice?.issue_date ?? today} /></Field>
        <Field label="Fecha límite de pago"><input name="due_date" type="date" className="input" defaultValue={invoice?.due_date ?? ""} /></Field>
      </div>
      <div className="card p-6">
        <h3 className="font-medium mb-4">Ítems</h3>
        <ItemsEditor initial={invoice?.invoice_items} />
      </div>
      <div className="card p-6">
        <Field label="Notas" hint="Tus datos bancarios se toman de tu perfil.">
          <textarea name="notes" rows={3} className="input" defaultValue={invoice?.notes ?? "No soy responsable de IVA."} />
        </Field>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <SubmitButton className="btn btn-soft" name="intent" value="save">Guardar borrador</SubmitButton>
        <SubmitButton name="intent" value="send" pendingText="Enviando…">Guardar y enviar al cliente</SubmitButton>
      </div>
    </form>
  );
}
