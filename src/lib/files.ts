export const fileKind = (type?: string | null, name?: string | null) => {
  const t = (type ?? "").toLowerCase(); const n = (name ?? "").toLowerCase();
  if (t.startsWith("image/") || /\.(png|jpe?g|gif|webp|avif)$/.test(n)) return "image";
  if (t.startsWith("video/") || /\.(mp4|mov|webm)$/.test(n)) return "video";
  if (t.startsWith("audio/") || /\.(mp3|m4a|wav|ogg|opus)$/.test(n)) return "audio";
  if (t === "application/pdf" || n.endsWith(".pdf")) return "pdf";
  return "file";
};
