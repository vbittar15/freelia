"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

/** Sube la imagen/video de la pieza a Supabase Storage y guarda la URL en un input oculto */
export function ImageUpload({ userId, initial, name = "asset_url" }: { userId: string; initial?: string | null; name?: string }) {
  const [url, setUrl] = useState(initial ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { setError("El archivo pesa más de 20 MB"); return; }
    setLoading(true); setError("");
    const supabase = createClient();
    const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
    const path = `${userId}/${crypto.randomUUID()}-${safe}`;
    const { error } = await supabase.storage.from("freelia-assets").upload(path, file, { upsert: false });
    if (error) { setError("No se pudo subir: " + error.message); setLoading(false); return; }
    const { data } = supabase.storage.from("freelia-assets").getPublicUrl(path);
    setUrl(data.publicUrl);
    setLoading(false);
  }

  const isVideo = /\.(mp4|mov|webm)$/i.test(url);

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      {url ? (
        <div className="relative rounded-2xl overflow-hidden border border-line bg-surface">
          {isVideo
            ? <video src={url} controls className="w-full max-h-96 min-h-[200px] object-contain" />
            // eslint-disable-next-line @next/next/no-img-element
            : <img src={url} alt="Pieza" className="w-full max-h-96 min-h-[200px] object-contain" />}
          <button type="button" onClick={() => setUrl("")} className="absolute top-2 right-2 btn btn-sm bg-white/90 text-ink">Quitar</button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-line bg-surface py-10 cursor-pointer hover:border-brand transition-colors">
          <span className="text-brand font-medium">{loading ? "Subiendo…" : "Subir imagen o video"}</span>
          <span className="text-[12px] text-muted">JPG, PNG, GIF o MP4 · máx. 20 MB</span>
          <input type="file" accept="image/*,video/*" className="hidden" onChange={onFile} disabled={loading} />
        </label>
      )}
      {error && <p className="text-[12px] text-ink mt-2">{error}</p>}
    </div>
  );
}
