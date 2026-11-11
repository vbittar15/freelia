import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireCreative } from "@/lib/auth";
import { ClientChip, Notice, PageHeader, StatusBadge } from "@/components/ui";
import { ConfirmSubmit, PrintButton, SubmitButton } from "@/components/client-ui";
import { ContractDocument } from "@/components/contract-doc";
import { ShareReview } from "@/components/share-review";
import type { Contract } from "@/lib/types";
import { defaultTerms } from "@/lib/contract";
import { clientLabel, fmtDateTime } from "@/lib/utils";
import { refreshFromServices, saveBody, sendContract, unsendContract, updateTerms, voidContract } from "../actions";

const OK: Record<string, string> = {
  terminos: "Condiciones actualizadas.", regenerado: "Contrato actualizado con los servicios del cliente.", texto: "Texto guardado.",
  enviado: "Contrato enviado. Tu cliente recibió el aviso para firmarlo.",
};

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string; nuevo?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase, profile } = await requireCreative();
  const { data } = await supabase.from("contracts").select("*, clients(name, company, color, email, phone, client_user_id)").eq("id", id).single();
  if (!data) notFound();
  const k = data as Contract;
  const t = { ...defaultTerms(profile), ...k.terms };
  const h = await headers();
  const site = process.env.NEXT_PUBLIC_SITE_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const name = clientLabel(k.clients);
  const statusLabel = { borrador: "Borrador", enviado: "Esperando firma", firmado: "Firmado", anulado: "Anulado" }[k.status];

  return (
    <>
      <PageHeader back={{ href: `/panel/clientes/${k.client_id}`, label: name }} title={`Contrato N.º ${k.number}`}
        subtitle={<span className="flex flex-wrap items-center gap-3 mt-1">
          <Link href={`/panel/clientes/${k.client_id}`}><ClientChip name={name} color={k.clients?.color} /></Link>
          <StatusBadge status={k.status === "firmado" ? "aprobado" : k.status === "enviado" ? "en_revision" : k.status === "anulado" ? "rechazada" : "borrador"} label={statusLabel} />
        </span>}
        actions={<PrintButton />} />

      {sp.nuevo && <div className="mb-5 no-print"><Notice tone="info">Generé el contrato con los servicios de {name}. Revisa las condiciones y el texto, y cuando esté listo, envíaselo para que lo firme.</Notice></div>}
      {sp.ok && OK[sp.ok] && <div className="mb-5 no-print"><Notice tone="ok">{OK[sp.ok]}</Notice></div>}
      {sp.error && <div className="mb-5 no-print"><Notice tone="error">{sp.error}</Notice></div>}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <ContractDocument k={k} />

        <aside className="space-y-4 no-print lg:sticky lg:top-6">
          {k.status === "borrador" && (
            <>
              <div className="rounded-[22px] bg-brand text-white p-5">
                <div className="font-semibold text-[16px]">¿Todo listo?</div>
                <p className="text-[13px] text-white/80 mt-1 mb-3">Al enviarlo quedas firmando como contratista y {name} recibe el aviso para firmar{k.clients?.client_user_id ? "" : " cuando entre a su portal"}.</p>
                {!profile.document_id && <p className="mb-3 rounded-[12px] bg-white/15 px-3 py-2 text-[13px]">Antes agrega tu cédula o NIT en <Link href="/panel/perfil" className="underline font-semibold">Mi perfil</Link>.</p>}
                <form action={sendContract}><input type="hidden" name="id" value={k.id} />
                  <SubmitButton className="btn bg-white text-brand-dark hover:bg-azul-t w-full" pendingText="Enviando…">Enviar para firma</SubmitButton></form>
              </div>

              <details className="card p-5 group" open={!!sp.nuevo}>
                <summary className="cursor-pointer list-none font-semibold flex justify-between">Condiciones <span className="text-muted group-open:rotate-180 transition-transform">⌄</span></summary>
                <form action={updateTerms} className="mt-4 grid grid-cols-2 gap-3">
                  <input type="hidden" name="id" value={k.id} />
                  <label className="block col-span-2"><span className="label">Fecha de inicio</span><input name="start" type="date" className="input" defaultValue={t.start} /></label>
                  <label className="block"><span className="label">Duración (meses)</span><input name="months" type="number" min={0} max={60} className="input" defaultValue={t.months ?? 0} /><span className="block text-[11px] text-muted px-1 mt-1">0 = indefinido</span></label>
                  <label className="block"><span className="label">Día de pago</span><input name="pay_day" type="number" min={1} max={28} className="input" defaultValue={t.pay_day} /></label>
                  <label className="block"><span className="label">Anticipo (%)</span><input name="advance" type="number" min={0} max={100} className="input" defaultValue={t.advance} /></label>
                  <label className="block"><span className="label">Rondas de cambios</span><input name="rounds" type="number" min={0} max={10} className="input" defaultValue={t.rounds} /></label>
                  <label className="block"><span className="label">Plazo de pago (días)</span><input name="due_days" type="number" min={0} max={90} className="input" defaultValue={t.due_days} /></label>
                  <label className="block"><span className="label">Preaviso (días)</span><input name="notice_days" type="number" min={0} max={90} className="input" defaultValue={t.notice_days} /></label>
                  <label className="block col-span-2"><span className="label">Ciudad</span><input name="city" className="input" defaultValue={t.city} /></label>
                  <SubmitButton className="btn btn-soft col-span-2">Aplicar condiciones</SubmitButton>
                </form>
                <p className="text-[12px] text-muted mt-3">Al aplicar, el texto se vuelve a generar. Si lo editaste a mano, esos cambios se reemplazan.</p>
              </details>

              <div className="card p-5 space-y-3">
                <div className="font-semibold">Servicios</div>
                <p className="text-[13px] text-muted">El contrato usa los servicios de la ficha del cliente.</p>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/panel/clientes/${k.client_id}/editar`} className="btn btn-soft btn-sm">Editar servicios</Link>
                  <form action={refreshFromServices}><input type="hidden" name="id" value={k.id} /><SubmitButton className="btn btn-ghost btn-sm">Actualizar contrato</SubmitButton></form>
                </div>
              </div>

              <details className="card p-5 group">
                <summary className="cursor-pointer list-none font-semibold flex justify-between">Editar el texto <span className="text-muted group-open:rotate-180 transition-transform">⌄</span></summary>
                <form action={saveBody} className="mt-4 space-y-3">
                  <input type="hidden" name="id" value={k.id} />
                  <label className="block"><span className="label">Título</span><input name="title" className="input" defaultValue={k.title} /></label>
                  <textarea name="body" rows={18} className="input text-[13px] leading-relaxed" defaultValue={k.body} />
                  <p className="text-[12px] text-muted">Usa “## ” al inicio de una línea para un título de cláusula y “- ” para viñetas.</p>
                  <SubmitButton className="btn btn-soft w-full">Guardar texto</SubmitButton>
                </form>
              </details>
              <p className="text-[12px] text-muted px-1">Este contrato es un modelo general para Colombia. Revísalo y ajústalo a tu caso; no reemplaza la asesoría de un abogado.</p>
            </>
          )}

          {k.status === "enviado" && (
            <div className="rounded-[22px] bg-azul-t p-5 space-y-3">
              <div className="font-semibold">Esperando la firma de {name}</div>
              <p className="text-[13px] text-muted">Enviado el {fmtDateTime(k.sent_at)}. Recuérdaselo con su enlace directo:</p>
              <ShareReview link={`${site}/cliente/contratos/${k.id}`} clientName={name} count={1} phone={k.clients?.phone}
                message="Te envié el contrato de prestación de servicios para que lo revises y lo firmes desde la app." />
              <form action={unsendContract}><input type="hidden" name="id" value={k.id} />
                <SubmitButton className="btn btn-ghost btn-sm">Volver a borrador para editar</SubmitButton></form>
            </div>
          )}

          {k.status === "firmado" && (
            <div className="rounded-[22px] bg-verde-t p-5 space-y-2">
              <div className="font-semibold">Contrato firmado</div>
              <p className="text-[13px] text-muted">{k.signer_name} lo firmó el {fmtDateTime(k.signed_at)}. Guárdalo en PDF con el botón Imprimir.</p>
              <form action={voidContract}><input type="hidden" name="id" value={k.id} />
                <ConfirmSubmit message="¿Anular este contrato? Quedará registrado como anulado.">Anular contrato</ConfirmSubmit></form>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
