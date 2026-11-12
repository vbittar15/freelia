import Link from "next/link";
import { addComment, markAllRead } from "@/app/shared-actions";
import type { Client, Invoice, LineItem, Notification, PostComment, Profile, Quote } from "@/lib/types";
import { clientLabel, cn, fmtDate, fmtDateTime, money, numberToWords, timeAgo, total } from "@/lib/utils";
import { SubmitButton } from "./client-ui";
import { Avatar, EmptyState } from "./ui";
import { Logo } from "./brand";

// ------------------------------------------------------------ Comentarios de una pieza
export function CommentThread({
  comments: all, postId, path, userId,
}: { comments: PostComment[]; postId: string; path: string; userId: string }) {
  const comments = all.filter((c) => c.x == null);
  const label = { comentario: "", aprobado: "aprobó la pieza", cambios: "pidió cambios" };
  return (
    <div className="card p-5">
      <h3 className="font-medium mb-4">Conversación de la pieza</h3>
      <div className="space-y-4">
        {comments.length === 0 && <p className="text-muted text-[13px]">Sin comentarios todavía.</p>}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Avatar name={c.profiles?.full_name} size={28} color={c.author_id === userId ? "var(--color-cielo)" : undefined} />
            <div className="min-w-0">
              <div className="text-[12px]">
                <span className="font-medium">{c.author_id === userId ? "Tú" : c.profiles?.full_name ?? "Usuario"}</span>
                {c.action !== "comentario" && (
                  <span className={cn("ml-1.5 badge", c.action === "aprobado" ? "bg-verde-t text-ink" : "bg-rosa-t text-ink")}>
                    {label[c.action]}
                  </span>
                )}
                <span className="text-muted ml-2">{timeAgo(c.created_at)}</span>
              </div>
              {c.body && <p className="mt-1 whitespace-pre-wrap leading-relaxed">{c.body}</p>}
            </div>
          </div>
        ))}
      </div>
      <form action={addComment} className="mt-5 flex gap-2">
        <input type="hidden" name="post_id" value={postId} />
        <input type="hidden" name="path" value={path} />
        <input name="body" className="input" placeholder="Escribe un comentario…" required />
        <SubmitButton className="btn btn-soft" pendingText="…">Comentar</SubmitButton>
      </form>
    </div>
  );
}

// ------------------------------------------------------------ Lista de notificaciones
export function NotificationList({ items, path }: { items: Notification[]; path: string }) {
  const unread = items.some((n) => !n.read_at);
  if (items.length === 0) return <EmptyState title="Todo en calma" text="Aquí verás aprobaciones, mensajes y movimientos de tus clientes." />;
  return (
    <div>
      {unread && (
        <form action={markAllRead} className="mb-4 flex justify-end">
          <input type="hidden" name="path" value={path} />
          <SubmitButton className="btn btn-ghost btn-sm" pendingText="…">Marcar todas como leídas</SubmitButton>
        </form>
      )}
      <div className="flex flex-col gap-2.5">
        {items.map((n) => (
          <Link key={n.id} href={n.link ?? "#"} className={cn("flex items-start gap-3 rounded-[20px] px-4 py-3.5 transition-colors", n.read_at ? "bg-surface hover:bg-surface-2" : "bg-azul-t hover:bg-[#cfd8ff]")}>
            <span className={cn("mt-2 size-2 rounded-full shrink-0", n.read_at ? "bg-gris" : "bg-brand")} />
            <div className="min-w-0 flex-1">
              <div className={cn("text-[15px]", !n.read_at ? "font-semibold" : "font-medium")}>{n.title}</div>
              {n.body && <div className="text-muted text-[13px] truncate">{n.body}</div>}
            </div>
            <span className="text-[11px] text-muted shrink-0">{timeAgo(n.created_at)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Documentos imprimibles: ver documents.tsx
export { InvoiceDocument, QuoteDocument } from "./documents";

export function fmtWhen(d: string | null) {
  return d ? fmtDateTime(d) : "Sin fecha";
}
