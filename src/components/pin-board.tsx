"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import type { PostComment } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { Lia } from "./brand";
import { Icon } from "./icons";

/** Comentarios sobre el arte: toca un punto de la imagen y deja tu comentario ahí */
export function PinBoard({ postId, imageUrl, comments, userId, canResolve, assetIdx = 0, readOnly, hideList }:
  { postId: string; imageUrl: string; comments: PostComment[]; userId: string; canResolve: boolean; assetIdx?: number; readOnly?: boolean; hideList?: boolean }) {
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [local, setLocal] = useState<PostComment[]>([]);

  const pins = [...comments, ...local.filter((l) => !comments.some((c) => c.id === l.id))]
    .filter((c) => c.x != null && c.y != null && (c.asset_idx ?? 0) === assetIdx)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  function place(e: React.MouseEvent<HTMLDivElement>) {
    if (readOnly) return;
    const r = box.current!.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    setDraft({ x, y });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft || !text.trim()) return;
    setSaving(true);
    const { data } = await createClient().from("post_comments")
      .insert({ post_id: postId, body: text.trim(), x: draft.x, y: draft.y, asset_idx: assetIdx })
      .select("*, profiles(full_name)").single();
    if (data) setLocal((l) => [...l, data as PostComment]);
    setDraft(null); setText(""); setSaving(false);
    router.refresh();
  }

  async function toggle(c: PostComment) {
    await createClient().from("post_comments").update({ resolved: !c.resolved }).eq("id", c.id);
    setLocal((l) => [...l.filter((x) => x.id !== c.id), { ...c, resolved: !c.resolved }]);
    router.refresh();
  }

  const shown = (c: PostComment) => local.find((l) => l.id === c.id) ?? c;
  const open = pins.filter((c) => !shown(c).resolved).length;

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex items-center gap-2 text-[13px] text-muted px-1">
          <span className="relative flex size-2.5"><span className="absolute inset-0 rounded-full bg-rosa anim-ping" /><span className="relative size-2.5 rounded-full bg-rosa" /></span>
          Toca cualquier punto para dejar un comentario ahí.
        </div>
      )}

      <div ref={box} onClick={place} className={cn("relative rounded-[20px] overflow-hidden bg-surface-2 select-none", !readOnly && "cursor-crosshair")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Arte de la pieza" className="w-full max-h-[75vh] object-contain pointer-events-none" draggable={false} />
        {pins.map((c, i) => {
          const s = shown(c);
          return (
            <button key={c.id} type="button" onClick={(e) => { e.stopPropagation(); setActive(active === c.id ? null : c.id); }}
              aria-label={`Comentario ${i + 1}`}
              className={cn("absolute -translate-x-1/2 -translate-y-1/2 size-8 rounded-full border-[2.5px] border-white shadow-[0_2px_8px_rgba(34,26,58,.3)] text-[13px] font-bold flex items-center justify-center transition-transform anim-pop cursor-pointer",
                s.resolved ? "bg-verde/90 text-ink" : "bg-rosa text-ink", active === c.id && "scale-125 ring-4 ring-rosa/30")}
              style={{ left: `${(c.x ?? 0) * 100}%`, top: `${(c.y ?? 0) * 100}%` }}>
              {s.resolved ? <Icon name="check" className="size-4" strokeWidth={2.6} /> : i + 1}
            </button>
          );
        })}
        {draft && (
          <span className="absolute -translate-x-1/2 -translate-y-1/2 size-8 rounded-full bg-brand text-white border-[2.5px] border-white shadow-lg flex items-center justify-center font-bold anim-pop"
            style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%` }}>+</span>
        )}
      </div>

      {draft && (
        <form onSubmit={save} className="flex gap-2 anim-pop">
          <input autoFocus value={text} onChange={(e) => setText(e.target.value)} className="input bg-white" placeholder={`Comentario para el punto ${pins.length + 1}…`} />
          <button type="button" onClick={() => setDraft(null)} className="btn btn-ghost px-3 shrink-0">Cancelar</button>
          <button className="btn btn-primary shrink-0" disabled={saving || !text.trim()}>{saving ? "…" : "Comentar"}</button>
        </form>
      )}

      {pins.length > 0 && !hideList && (
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <h3 className="h2">Comentarios sobre esta imagen</h3>
            {open > 0 && <span className="min-w-[22px] h-[22px] px-[7px] rounded-full bg-rosa-t text-[12px] font-bold inline-flex items-center justify-center">{open}</span>}
          </div>
          <div className="flex flex-col gap-2">
            {pins.map((c, i) => {
              const s = shown(c);
              return (
                <div key={c.id} onMouseEnter={() => setActive(c.id)} onMouseLeave={() => setActive(null)}
                  className={cn("flex items-start gap-3 rounded-[18px] px-3.5 py-3 transition-colors", active === c.id ? "bg-rosa-t" : "bg-white", s.resolved && "opacity-60")}>
                  <span className={cn("size-7 rounded-full text-[12px] font-bold flex items-center justify-center shrink-0", s.resolved ? "bg-verde-t" : "bg-rosa")}>{s.resolved ? <Icon name="check" className="size-4" strokeWidth={2.6} /> : i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] text-muted"><b className="text-ink font-semibold">{c.author_id === userId ? "Tú" : c.profiles?.full_name ?? "Cliente"}</b> · {timeAgo(c.created_at)}</div>
                    <p className={cn("text-[14px] leading-snug mt-0.5", s.resolved && "line-through")}>{c.body}</p>
                  </div>
                  {canResolve && !readOnly && (
                    <button type="button" onClick={() => toggle(s)} className="btn btn-sm shrink-0 bg-surface text-ink hover:bg-surface-2">
                      {s.resolved ? "Reabrir" : "Resolver"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {pins.length === 0 && !draft && !readOnly && (
        <div className="flex items-center gap-3 px-1 text-[13px] text-muted"><Lia size={22} mood="idea" color="#FFC93C" /> Aún no hay comentarios sobre el arte.</div>
      )}
    </div>
  );
}
