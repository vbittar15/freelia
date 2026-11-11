"use client";

import { useRef, useState } from "react";
import type { FileRef } from "@/lib/types";
import { uploadFile } from "@/lib/upload";
import { fileKind } from "@/lib/files";
import { Icon } from "./icons";

/** Adjuntar varios archivos a un formulario (guarda JSON en un input oculto) */
export function FilePicker({ userId, name = "attachments", initial = [] }: { userId: string; name?: string; initial?: FileRef[] }) {
  const [files, setFiles] = useState<FileRef[]>(initial);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function onPick(list: FileList | null) {
    if (!list?.length) return;
    setError("");
    const arr = Array.from(list);
    setBusy((b) => b + arr.length);
    for (const f of arr) {
      try {
        const ref = await uploadFile(f, userId);
        setFiles((prev) => [...prev, ref]);
      } catch (e) { setError((e as Error).message); }
      finally { setBusy((b) => b - 1); }
    }
    if (input.current) input.current.value = "";
  }

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(files)} />
      <div className="flex flex-wrap gap-2">
        {files.map((f, i) => (
          <div key={f.url} className="relative group anim-pop">
            {fileKind(f.type, f.name) === "image"
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={f.url} alt={f.name} className="size-20 rounded-[14px] object-cover bg-surface-2" />
              : <div className="h-20 w-36 rounded-[14px] bg-white p-2.5 flex flex-col justify-between"><span className="text-[10px] font-bold text-brand-dark uppercase">{fileKind(f.type, f.name)}</span><span className="text-[12px] font-semibold line-clamp-2 break-all">{f.name}</span></div>}
            <button type="button" aria-label={`Quitar ${f.name}`} onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}
              className="absolute -top-2 -right-2 size-6 rounded-full bg-ink text-white text-[11px] flex items-center justify-center shadow cursor-pointer"><Icon name="x" className="size-3.5" strokeWidth={2.4} /></button>
          </div>
        ))}
        {Array.from({ length: busy }).map((_, i) => <div key={i} className="size-20 rounded-[14px] bg-surface-2 animate-pulse" />)}
        <button type="button" onClick={() => input.current?.click()}
          className="h-20 px-4 rounded-[14px] border-2 border-dashed border-line hover:border-brand bg-white text-[13px] font-semibold text-brand-dark flex items-center gap-2 cursor-pointer transition-colors">
          <span className="text-[18px] leading-none">+</span> Adjuntar archivos
        </button>
      </div>
      <input ref={input} type="file" multiple className="hidden" onChange={(e) => onPick(e.target.files)}
        accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.ai,.psd,.fig" />
      <p className="text-[12px] text-muted mt-2 px-1">Imágenes, PDF, audios, videos o documentos · máx. 25 MB cada uno.</p>
      {error && <p className="text-[13px] text-[#c03a77] mt-1 px-1">{error}</p>}
    </div>
  );
}
