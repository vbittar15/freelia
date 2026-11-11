import type { FileRef } from "@/lib/types";
import { fileKind } from "@/lib/files";
import { cn } from "@/lib/utils";
import { Icon } from "./icons";

const ICON: Record<string, React.ReactNode> = {
  pdf: <span className="text-[10px] font-bold">PDF</span>, audio: <Icon name="music" className="size-[18px]" />, video: <Icon name="play" className="size-[18px]" />,
  file: <Icon name="file" className="size-[18px]" />, image: <Icon name="image" className="size-[18px]" />,
};

/** Muestra un archivo: imagen en miniatura, audio/video reproducible o ficha descargable */
export function FileView({ file, compact, onDark }: { file: FileRef; compact?: boolean; onDark?: boolean }) {
  const kind = fileKind(file.type, file.name);
  if (kind === "image") {
    return (
      <a href={file.url} target="_blank" rel="noopener noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={file.url} alt={file.name} className={cn("rounded-[14px] object-cover bg-surface-2", compact ? "size-20" : "max-h-72 w-full max-w-xs")} />
      </a>
    );
  }
  if (kind === "audio") return <audio src={file.url} controls className="w-full max-w-xs h-10" />;
  if (kind === "video") return <video src={file.url} controls className="rounded-[14px] max-h-72 w-full max-w-xs bg-ink" />;
  return (
    <a href={file.url} target="_blank" rel="noopener noreferrer"
      className={cn("inline-flex items-center gap-2.5 rounded-[14px] pl-2 pr-3.5 py-2 max-w-full transition-colors",
        onDark ? "bg-white/15 hover:bg-white/25" : "bg-white hover:bg-surface-2")}>
      <span className={cn("size-9 rounded-[10px] flex items-center justify-center text-[11px] font-bold shrink-0", onDark ? "bg-white/20" : "bg-azul-t")}>{ICON[kind]}</span>
      <span className="text-[13px] font-semibold truncate">{file.name}</span>
    </a>
  );
}

export function FileGrid({ files }: { files: FileRef[] }) {
  if (!files.length) return null;
  return <div className="flex flex-wrap gap-2">{files.map((f) => <FileView key={f.url} file={f} compact />)}</div>;
}
