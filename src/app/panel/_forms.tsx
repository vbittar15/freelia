import { SubmitButton } from "@/components/client-ui";
import { Field } from "@/components/ui";
import { ItemsEditor } from "@/components/items-editor";
import { ClientServicesEditor } from "@/components/client-services-editor";
import { BrandEditor } from "@/components/brand-editor";
import { MODULES } from "@/lib/modules";
import { RequestFields } from "@/components/request-fields";
import type { RequestKind } from "@/lib/requests";
import type { CatalogItem } from "@/lib/catalog";
import { FilePicker } from "@/components/file-picker";
import type { Brief, Client, ClientService, Invoice, ModuleKey, Package, Post, Quote, Service } from "@/lib/types";
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

export function ClientForm({ client, services = [], packages = [], lines = [], hasDraft, userId, defaultModules }: { client?: Client; services?: Service[]; packages?: Package[]; lines?: ClientService[]; hasDraft?: boolean; userId: string; defaultModules: Record<ModuleKey, boolean> }) {
  const mods = { ...defaultModules, ...(client?.modules ?? {}) };
  return (
    <form action={saveClient} className="grid gap-5 max-w-3xl">
    <div className="card p-6 grid sm:grid-cols-2 gap-4">
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
    </div>
    <div className="card p-6">
      <h2 className="h2">Marca del cliente</h2>
      <p className="text-[13px] text-muted mt-1 mb-4">Con su logo y colores, su portal en Freelia se ve con su marca. El brand book queda a mano para todo el equipo.</p>
      <BrandEditor userId={userId} initial={client?.brand} logo={client?.logo_url} brandbook={client?.brandbook_url} clientName={client?.company || client?.name} />
    </div>
    <div className="card p-6">
      <h2 className="h2">Qué trabajas con este cliente</h2>
      <p className="text-[13px] text-muted mt-1 mb-4">Activa solo lo que usas. Lo desactivado no aparece ni en tu panel ni en su portal.</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {MODULES.map((m) => (
          <label key={m.key} className="flex items-start gap-3 rounded-[16px] bg-white px-4 py-3 cursor-pointer has-[:checked]:ring-2 has-[:checked]:ring-brand transition">
            <input type="checkbox" name={`mod_${m.key}`} defaultChecked={mods[m.key] !== false} className="size-4 mt-1 accent-[#3d5bf5]" />
            <span><span className="block font-semibold text-[14px]">{m.label}</span><span className="block text-[12px] text-muted">{m.hint}</span></span>
          </label>
        ))}
      </div>
    </div>
    <div className="card p-6">
      <h2 className="h2">Servicios que le prestas</h2>
      <p className="text-[13px] text-muted mt-1 mb-4">Elige de tus servicios o paquetes, o escribe uno a la medida. Ajusta el valor para este cliente.</p>
      <ClientServicesEditor services={services} packages={packages} initial={lines} />
    </div>
    <label className="flex items-start gap-3 rounded-[18px] bg-azul-t px-4 py-3.5 cursor-pointer">
      <input type="checkbox" name="contract" defaultChecked={!client || hasDraft} className="size-4 mt-1 accent-[#3d5bf5]" />
      <span><span className="block font-semibold text-[15px]">{client ? (hasDraft ? "Actualizar el contrato en borrador con estos servicios" : "Generar un contrato nuevo con estos servicios") : "Generar el contrato para que lo firme"}</span>
        <span className="block text-[13px] text-muted">Lo revisas y se lo envías desde la app. {client?.client_user_id ? "Lo firma desde su portal." : "Lo firma cuando entre a su portal con la invitación."}</span></span>
    </label>
    <div className="flex justify-end">
      <SubmitButton>{client ? "Guardar cambios" : "Crear cliente"}</SubmitButton>
    </div>
    </form>
  );
}

export function BriefForm({ brief, clients, clientId, userId, kind }: { brief?: Brief; clients: ClientOpt[]; clientId?: string; userId: string; kind: RequestKind }) {
  return (
    <form action={saveBrief} className="card p-5 sm:p-6 grid sm:grid-cols-2 gap-4 max-w-3xl">
      {brief && <input type="hidden" name="id" value={brief.id} />}
      <div className="sm:col-span-2"><ClientSelect clients={clients} value={brief?.client_id ?? clientId} disabled={!!brief} /></div>
      <RequestFields kind={kind} brief={brief} />
      {kind.files && <div className="sm:col-span-2"><span className="label">Archivos</span><FilePicker userId={userId} initial={brief?.attachments ?? []} /></div>}
      <div className="sm:col-span-2 flex justify-end">
        <SubmitButton>{brief ? "Guardar cambios" : `Crear ${kind.label.toLowerCase()}`}</SubmitButton>
      </div>
    </form>
  );
}

type BriefOpt = { id: string; title: string; client_id: string };

export function PostForm({ post, clients, userId, clientId, date, briefs = [], briefId, networks, formats, word = "pieza" }: { post?: Post; clients: ClientOpt[]; userId: string; clientId?: string; date?: string; briefs?: BriefOpt[]; briefId?: string; networks?: string[]; formats?: string[]; word?: string }) {
  const netKeys = networks?.length ? [...networks, ...Object.keys(NETWORKS).filter((k) => !networks.includes(k))] : Object.keys(NETWORKS);
  const fmtKeys = formats?.length ? formats : Object.keys(FORMATS);
  const cid = post?.client_id ?? clientId;
  const briefOpts = briefs.filter((b) => !cid || b.client_id === cid);
  const canSend = !post || post.status === "borrador" || post.status === "cambios";
  return (
    <form action={savePost} className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-5">
      {post && <input type="hidden" name="id" value={post.id} />}
      {post?.networks?.map((k) => <input key={k} type="hidden" name="networks" value={k} />)}
      <div className="card p-6 space-y-4">
        <Field label={`Título de la ${word} *`}><input name="title" className="input" required defaultValue={post?.title} placeholder="Ej. Lanzamiento sabor maracuyá" /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Tema"><input name="topic" className="input" defaultValue={post?.topic ?? ""} placeholder="Ej. Día del padre" /></Field>
          <Field label="Idea o concepto"><input name="idea" className="input" defaultValue={post?.idea ?? ""} placeholder="Qué se va a mostrar" /></Field>
        </div>
        <Field label="Texto en la pieza"><textarea name="art_text" rows={2} className="input" defaultValue={post?.art_text ?? ""} placeholder="Lo que va escrito sobre el diseño" /></Field>
        <Field label="Copy"><textarea name="copy" rows={6} className="input" defaultValue={post?.copy ?? ""} placeholder="Texto de la publicación, hashtags, CTA…" /></Field>
        <div>
          <span className="label">Material · imágenes, video, PDF o cualquier archivo</span>
          <FilePicker userId={userId} name="assets"
            initial={post?.assets?.length ? post.assets : post?.asset_url ? [{ url: post.asset_url, name: "arte", type: /\.(mp4|mov|webm)$/i.test(post.asset_url) ? "video/mp4" : "image/*" }] : []} />
          <p className="text-[12px] text-muted mt-1.5 px-1">Para un carrusel sube todas las láminas en orden. Tu cliente podrá marcar cambios sobre cada imagen.</p>
        </div>
        <Field label="Enlace (opcional)" hint="Figma, sitio web, video en Drive o YouTube…">
          <input name="link_url" type="url" className="input" defaultValue={post?.link_url ?? ""} placeholder="https://" />
        </Field>
      </div>
      <div className="space-y-4">
        <div className="card p-6 space-y-4">
          <ClientSelect clients={clients} value={post?.client_id ?? clientId} disabled={!!post} />
          <div className="group/soc space-y-4">
            <label className="flex items-center justify-between gap-3 rounded-[16px] bg-white px-4 py-3 cursor-pointer">
              <span><span className="block font-semibold text-[14px]">Es para redes sociales</span><span className="block text-[12px] text-muted">Pide red y fecha de publicación</span></span>
              <input type="checkbox" name="social" defaultChecked={post ? post.social !== false : networks?.[0] !== "entrega"} className="peer sr-only" />
              <span className="relative h-7 w-12 shrink-0 rounded-full bg-surface-2 transition-colors peer-checked:bg-brand after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
            </label>
            <div className="hidden group-has-[input[name=social]:checked]/soc:block">
              <Field label="Red o canal">
                <select name="network" className="input" defaultValue={post?.network ?? netKeys[0]}>
                  {netKeys.map((k) => <option key={k} value={k}>{NETWORKS[k]}</option>)}
                </select>
              </Field>
            </div>
          </div>
          <Field label="Tipo de material">
            <select name="format" className="input" defaultValue={post?.format ?? fmtKeys[0]}>
              {fmtKeys.map((k) => <option key={k} value={k}>{FORMATS[k]}</option>)}
            </select>
          </Field>
          <Field label="Fecha (publicación o entrega)">
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
          <SubmitButton name="intent" value="save">{post?.status === "cambios" ? "Guardar corrección" : post ? "Guardar cambios" : `Guardar ${word}`}</SubmitButton>
          {canSend && (
            <SubmitButton className="btn btn-soft" name="intent" value="review" pendingText="Guardando…">
              {post?.status === "cambios" ? "Guardar y reenviar →" : "Guardar y enviar a revisión →"}
            </SubmitButton>
          )}
          {canSend && <p className="text-[12px] text-muted text-center px-2">Tip: guarda varias piezas y envíalas juntas. Tu cliente recibe un solo aviso.</p>}
        </div>
      </div>
    </form>
  );
}

export function QuoteForm({ quote, clients, clientId, catalog, defaults }: { quote?: Quote; clients: ClientOpt[]; clientId?: string; catalog?: CatalogItem[]; defaults?: { valid_until?: string; notes?: string } }) {
  return (
    <form action={saveQuote} className="space-y-5 max-w-4xl">
      {quote && <input type="hidden" name="id" value={quote.id} />}
      <div className="card p-6 grid sm:grid-cols-2 gap-4">
        <ClientSelect clients={clients} value={quote?.client_id ?? clientId} disabled={!!quote} />
        <Field label="Título *"><input name="title" className="input" required defaultValue={quote?.title} placeholder="Ej. Gestión de redes – diciembre" /></Field>
        <Field label="Válida hasta"><input name="valid_until" type="date" className="input" defaultValue={quote ? quote.valid_until ?? "" : defaults?.valid_until ?? ""} /></Field>
      </div>
      <div className="card p-6">
        <h3 className="font-medium mb-4">Ítems</h3>
        <ItemsEditor initial={quote?.quote_items} catalog={catalog} />
      </div>
      <div className="card p-6">
        <Field label="Condiciones / notas">
          <textarea name="notes" rows={4} className="input" defaultValue={quote ? quote.notes ?? "" : defaults?.notes ?? "50% de anticipo para iniciar y 50% contra entrega.\nIncluye 2 rondas de ajustes."} />
        </Field>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <SubmitButton className="btn btn-soft" name="intent" value="save">Guardar borrador</SubmitButton>
        <SubmitButton name="intent" value="send" pendingText="Enviando…">Guardar y enviar al cliente</SubmitButton>
      </div>
    </form>
  );
}

export function InvoiceForm({ invoice, clients, clientId, catalog, defaults }: { invoice?: Invoice; clients: ClientOpt[]; clientId?: string; catalog?: CatalogItem[]; defaults?: { due_date?: string; notes?: string; tax_rate?: number; withholding_rate?: number } }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={saveInvoice} className="space-y-5 max-w-4xl">
      {invoice && <input type="hidden" name="id" value={invoice.id} />}
      <div className="card p-6 grid sm:grid-cols-2 gap-4">
        <ClientSelect clients={clients} value={invoice?.client_id ?? clientId} disabled={!!invoice} />
        <Field label="Por concepto de *"><input name="concept" className="input" required defaultValue={invoice?.concept} placeholder="Ej. Servicios de diseño – noviembre" /></Field>
        <Field label="Fecha de emisión"><input name="issue_date" type="date" className="input" defaultValue={invoice?.issue_date ?? today} /></Field>
        <Field label="Fecha límite de pago"><input name="due_date" type="date" className="input" defaultValue={invoice ? invoice.due_date ?? "" : defaults?.due_date ?? ""} /></Field>
      </div>
      <div className="card p-6">
        <h3 className="font-medium mb-4">Ítems</h3>
        <ItemsEditor initial={invoice?.invoice_items} catalog={catalog} />
      </div>
      <div className="card p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Descuento ($)"><input name="discount" type="number" min={0} step={1000} className="input" defaultValue={invoice?.discount ?? 0} /></Field>
        <Field label="IVA (%)" hint="0 si no eres responsable de IVA"><input name="tax_rate" type="number" min={0} max={30} step="0.01" className="input" defaultValue={invoice?.tax_rate ?? defaults?.tax_rate ?? 0} /></Field>
        <Field label="Retención en la fuente (%)" hint="La que te descuenta tu cliente"><input name="withholding_rate" type="number" min={0} max={20} step="0.01" className="input" defaultValue={invoice?.withholding_rate ?? defaults?.withholding_rate ?? 0} /></Field>
      </div>
      <div className="card p-6">
        <Field label="Notas" hint="Tus datos bancarios se toman de tu perfil.">
          <textarea name="notes" rows={3} className="input" defaultValue={invoice ? invoice.notes ?? "" : defaults?.notes ?? "No soy responsable de IVA."} />
        </Field>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <SubmitButton className="btn btn-soft" name="intent" value="save">Guardar borrador</SubmitButton>
        <SubmitButton name="intent" value="send" pendingText="Enviando…">Guardar y enviar al cliente</SubmitButton>
      </div>
    </form>
  );
}
