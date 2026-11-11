"use client";

import { useState } from "react";
import type { FileRef, PostComment, PostVersion } from "@/lib/types";
import { fileKind } from "@/lib/files";
import { cn } from "@/lib/utils";
import { PinBoard } from "./pin-board";
import { FileView } from "./files";
import { Lia } from "./brand";
import { Icon } from "./icons";

/** Visor del material: varios archivos, pines por imagen y versiones anteriores */
export function AssetViewer({ postId, userId, assets, link, comments, versions = [], currentRound = 1, canPin, canResolve }: {
  postId: string; userId: string; assets: FileRef[]; link?: string | null; comments: PostComment[];
  versions?: PostVersion[]; currentRound?: number; canPin: boolean; canResolve: boolean;
}) {
  const older = versions.filter((v) => v.round < currentRound).sort((a, b) => b.round - a.round);
  const [round, setRound] = useState(currentRound);
  const [idx, setIdx] = useState(0);
  const viewingOld = round !== currentRound;
  const list = viewingOld ? older.find((v) => v.round === round)?.assets ?? [] : assets;
  const cur = list[Math.min(idx, list.length - 1)];
  const kind = cur ? fileKind(cur.type, cur.name) : null;
  const pinsFor = viewingOld
    ? comments.filter((c) => c.round === round)
    : comments.filter((c) => c.round == null || c.round >= currentRound || !c.resolved);
  const openOn = (i: number) => pinsFor.filter((c) => c.x != null && (c.asset_idx ?? 0) === i && !c.resolved).length;

  return (
    <div className="space-y-3">
      {older.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] text-muted mr-1">Versión</span>
          {[currentRound, ...older.map((v) => v.round)].map((r) => (
            <button key={r} type="button" onClick={() => { setRound(r); setIdx(0); }}
              className={cn("btn btn-sm", r === round ? "bg-ink text-white" : "bg-white text-ink hover:bg-surface-2")}>
              v{r}{r === currentRound ? " · actual" : ""}
            </button>
          ))}
        </div>
      )}
      {viewingOld && <p className="rounded-[14px] bg-amarillo-t px-3 py-2 text-[13px]">Estás viendo la versión {round}, con los comentarios que se hicieron sobre ella.</p>}

      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {list.map((f, i) => {
            const k = fileKind(f.type, f.name);
            const n = viewingOld ? 0 : openOn(i);
            return (
              <button key={f.url + i} type="button" onClick={() => setIdx(i)} aria-label={`Ver archivo ${i + 1}`}
                className={cn("relative shrink-0 size-16 rounded-[14px] overflow-hidden transition-all", i === idx ? "ring-[3px] ring-brand" : "opacity-70 hover:opacity-100")}>
                {k === "image"
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={f.url} alt="" className="size-full object-cover bg-surface-2" />
                  : <span className="size-full grid place-items-center bg-azul-t text-[10px] font-bold uppercase text-brand-dark">{k}</span>}
                <span className="absolute bottom-0.5 left-1 text-[10px] font-bold text-white drop-shadow">{i + 1}</span>
                {n > 0 && <span className="absolute top-1 right-1 size-4 rounded-full bg-rosa text-[10px] font-bold grid place-items-center">{n}</span>}
              </button>
            );
          })}
        </div>
      )}

      {!cur ? (
        <div className="aspect-video rounded-[20px] bg-lila-t flex flex-col items-center justify-center gap-2 text-muted">
          <Lia size={48} mood="sleep" color="#A98BFF" />
          {link ? "El material está en el enlace" : "Aún no hay archivos"}
        </div>
      ) : kind === "image" ? (
        <PinBoard key={`${round}-${idx}`} postId={postId} imageUrl={cur.url} comments={pinsFor} userId={userId}
          canResolve={canResolve} assetIdx={idx} readOnly={viewingOld || !canPin} />
      ) : kind === "video" ? (
        <video key={cur.url} src={cur.url} controls playsInline className="w-full max-h-[75vh] rounded-[20px] bg-ink" />
      ) : kind === "pdf" ? (
        <div className="space-y-2">
          <iframe key={cur.url} src={`${cur.url}#view=FitH`} title={cur.name} className="w-full h-[70vh] rounded-[20px] bg-white" />
          <a href={cur.url} target="_blank" rel="noopener noreferrer" className="btn btn-soft btn-sm">Abrir PDF en otra pestaña</a>
        </div>
      ) : (
        <div className="rounded-[20px] bg-surface p-6 flex flex-col items-center gap-3"><FileView file={cur} /></div>
      )}

      {link && (
        <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-[18px] bg-azul-t px-4 py-3 hover:ring-2 hover:ring-brand/30 transition">
          <span className="size-9 rounded-[12px] bg-white grid place-items-center text-brand-dark"><Icon name="link" className="size-[18px]" /></span>
          <span className="min-w-0 flex-1"><span className="block font-semibold text-[14px]">Abrir enlace</span><span className="block text-[12px] text-muted truncate">{link}</span></span>
        </a>
      )}
    </div>
  );
}
