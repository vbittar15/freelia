"use client";

import { useState } from "react";
import { zipSync, type Zippable } from "fflate";

const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "archivo";

/** Descarga varios archivos en un .zip */
export function DownloadAll({ files, zipName, label = "Descargar todo (.zip)", className = "btn btn-primary" }: {
  files: { url: string; name: string; folder?: string }[]; zipName: string; label?: string; className?: string;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  async function run() {
    const zip: Zippable = {};
    let fail = 0;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      setBusy(`${i + 1}/${files.length}`);
      try {
        const r = await fetch(f.url);
        if (!r.ok) throw 0;
        const ext = f.url.split("?")[0].match(/\.([a-z0-9]{2,5})$/i)?.[1];
        let path = (f.folder ? slug(f.folder) + "/" : "") + slug(f.name.replace(/\.[a-z0-9]{2,5}$/i, ""));
        if (ext) path += "." + ext.toLowerCase();
        while (zip[path]) path = path.replace(/(\.[a-z0-9]+)?$/i, (e) => `-2${e}`);
        zip[path] = [new Uint8Array(await r.arrayBuffer()), { level: 0 }];
      } catch { fail++; }
    }
    const blob = new Blob([zipSync(zip)], { type: "application/zip" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `${slug(zipName)}.zip`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    setBusy(fail ? `${fail} sin descargar` : null);
  }
  if (!files.length) return null;
  return (
    <button type="button" onClick={run} disabled={!!busy && busy.includes("/")} className={`${className} disabled:opacity-60`}>
      {busy?.includes("/") ? `Preparando ${busy}…` : label}
    </button>
  );
}
