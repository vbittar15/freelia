"use client";

import { createClient } from "@/lib/supabase/browser";
import type { FileRef } from "./types";
export { fileKind } from "./files";

export const MAX_MB = 25;

/** Sube un archivo a Supabase Storage en la carpeta del usuario y devuelve su URL pública */
export async function uploadFile(file: File, userId: string): Promise<FileRef> {
  if (file.size > MAX_MB * 1024 * 1024) throw new Error(`El archivo pesa más de ${MAX_MB} MB`);
  const supabase = createClient();
  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "";
  const base = file.name.replace(/\.[^.]+$/, "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "archivo";
  const path = `${userId}/${crypto.randomUUID()}-${base}${ext ? "." + ext : ""}`;
  const { error } = await supabase.storage.from("freelia-assets").upload(path, file, { contentType: file.type || undefined });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("freelia-assets").getPublicUrl(path);
  return { url: data.publicUrl, name: file.name, type: file.type || "application/octet-stream" };
}

