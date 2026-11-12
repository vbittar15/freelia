import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { EmptyState, PageHeader } from "@/components/ui";
import { StatusPill } from "@/components/brand";
import { Icon } from "@/components/icons";
import { SubmitButton } from "@/components/client-ui";
import type { Post } from "@/lib/types";
import { DAYS, FORMATS, SOCIAL, isoToBogotaLocal } from "@/lib/utils";
import { approveAll } from "../actions";

export const metadata = { title: "Parrilla" };

export default async function Page({ searchParams }: { searchParams: Promise<{ mes?: string; aprobada?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireClient();
  const mes = /^\d{4}-\d{2}$/.test(sp.mes ?? "") ? sp.mes! : isoToBogotaLocal(new Date().toISOString()).slice(0, 7);
  const [y, m] = mes.split("-").map(Number);
  const fmtM = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const start = new Date(Date.UTC(y, m - 1, 1, 5)).toISOString(), end = new Date(Date.UTC(y, m, 1, 5)).toISOString();
  const { data } = await supabase.from("posts").select("*").eq("social", true).neq("status", "borrador")
    .gte("scheduled_at", start).lt("scheduled_at", end).order("scheduled_at");
  const rows = (data ?? []) as Post[];
  const pending = rows.filter((p) => p.status === "en_revision");
  const ml = new Date(y, m - 1, 1).toLocaleDateString("es-CO", { month: "long" });
  const label = `${ml[0].toUpperCase()}${ml.slice(1)} ${y}`;

  return (
    <>
      <PageHeader title="Parrilla de contenido" subtitle="Todas tus publicaciones del mes en un solo lugar." />
      {sp.aprobada && <p className="mb-5 rounded-[18px] bg-verde-t px-4 py-3 text-[14px]">¡Aprobaste {sp.aprobada} {sp.aprobada === "1" ? "publicación" : "publicaciones"}! Tu equipo ya fue notificado.</p>}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <Link href={`/cliente/parrilla?mes=${fmtM(new Date(y, m - 2, 1))}`} className="btn btn-ghost btn-sm !px-2.5" aria-label="Mes anterior"><Icon name="chevronLeft" className="size-4" /></Link>
        <h2 className="h2 min-w-[170px] text-center">{label}</h2>
        <Link href={`/cliente/parrilla?mes=${fmtM(new Date(y, m, 1))}`} className="btn btn-ghost btn-sm !px-2.5" aria-label="Mes siguiente"><Icon name="chevronRight" className="size-4" /></Link>
        {pending.length > 0 && (
          <form action={approveAll} className="ml-auto">
            <input type="hidden" name="back" value={`/cliente/parrilla?mes=${mes}`} />
            {pending.map((p) => <input key={p.id} type="hidden" name="post_ids" value={p.id} />)}
            <SubmitButton className="btn btn-approve btn-sm" pendingText="Aprobando…"><Icon name="check" className="size-4" strokeWidth={2.4} /> Aprobar todo el mes ({pending.length})</SubmitButton>
          </form>
        )}
      </div>

      {rows.length === 0 ? <EmptyState title="Aún no hay publicaciones este mes" text="Cuando tu equipo te envíe la parrilla, la verás aquí." /> : (
        <div className="rounded-[20px] ring-1 ring-line bg-surface overflow-x-auto">
          <table className="w-max min-w-full text-left text-[13px] border-separate border-spacing-0">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-muted">
                {["Fecha", "Tema", "Idea", "Texto en la pieza", "Copy", "Formato", "Redes", "Arte", "Estado", ""].map((h, i) => (
                  <th key={i} className={`bg-surface-2 px-3 py-2.5 font-semibold border-b border-line ${i === 0 ? "sticky left-0 z-10" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const loc = isoToBogotaLocal(p.scheduled_at!);
                const nets = p.networks?.length ? p.networks : [p.network];
                return (
                  <tr key={p.id} className="align-top">
                    <td className="sticky left-0 bg-surface px-3 py-3 border-b border-line w-[120px]">
                      <div className="font-semibold">{Number(loc.slice(8, 10))}/{Number(loc.slice(5, 7))}</div>
                      <div className="text-[11px] text-muted capitalize">{DAYS[new Date(loc.slice(0, 10) + "T12:00:00").getDay()]} · {loc.slice(11, 16)}</div>
                    </td>
                    <td className="px-3 py-3 border-b border-line w-[160px] font-semibold">{p.topic || p.title}</td>
                    <td className="px-3 py-3 border-b border-line w-[220px] whitespace-pre-wrap">{p.idea}</td>
                    <td className="px-3 py-3 border-b border-line w-[200px] whitespace-pre-wrap">{p.art_text}</td>
                    <td className="px-3 py-3 border-b border-line w-[280px] whitespace-pre-wrap">{p.copy}</td>
                    <td className="px-3 py-3 border-b border-line w-[120px]">{FORMATS[p.format] ?? p.format}</td>
                    <td className="px-3 py-3 border-b border-line w-[130px]">
                      <div className="flex flex-wrap gap-1">{nets.map((k) => { const n = SOCIAL.find((x) => x.key === k); return <span key={k} title={n?.label} className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: n?.color ?? "#8c849f" }}>{n?.abbr ?? k}</span>; })}</div>
                    </td>
                    <td className="px-3 py-3 border-b border-line w-[76px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.asset_url && !/\.(mp4|mov|webm)$/i.test(p.asset_url) ? <img src={p.asset_url} alt="" className="size-14 rounded-[12px] object-cover" /> : <span className="text-faint">—</span>}
                    </td>
                    <td className="px-3 py-3 border-b border-line w-[120px]"><StatusPill status={p.status} /></td>
                    <td className="px-3 py-3 border-b border-line w-[120px]">
                      <Link href={`/cliente/aprobaciones/${p.id}${p.status === "en_revision" && p.review_request_id ? `?r=${p.review_request_id}` : ""}`}
                        className="btn btn-soft btn-sm whitespace-nowrap">{p.status === "en_revision" ? "Revisar" : "Ver"}</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[12px] text-muted mt-3 px-1">Para comentar o pedir cambios en una publicación, ábrela con “Revisar”.</p>
    </>
  );
}
