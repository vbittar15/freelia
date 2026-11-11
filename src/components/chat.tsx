"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import type { FileRef, Message } from "@/lib/types";
import { uploadFile } from "@/lib/upload";
import { cn, fmtDateTime } from "@/lib/utils";
import { FileView } from "./files";
import { Lia } from "./brand";

/** Chat en tiempo real de una conversación (una por cliente), con archivos */
export function Chat({
  clientId, userId, initial, otherName,
}: { clientId: string; userId: string; initial: Message[]; otherName: string }) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const picker = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel("chat-" + clientId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `client_id=eq.${clientId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((arr) => (arr.some((x) => x.id === m.id) ? arr : [...arr, m]));
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [clientId]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  async function insert(row: { body: string; attachment_url?: string; attachment_name?: string; attachment_type?: string }) {
    const { data, error } = await createClient().from("messages").insert({ client_id: clientId, ...row }).select().single();
    if (error) { setError("No se pudo enviar. Intenta de nuevo."); return false; }
    setMessages((arr) => (arr.some((x) => x.id === data.id) ? arr : [...arr, data as Message]));
    return true;
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true); setError("");
    if (await insert({ body })) setText("");
    setSending(false);
  }

  async function sendFiles(list: FileList | null) {
    if (!list?.length) return;
    setUploading(true); setError("");
    for (const f of Array.from(list)) {
      try {
        const ref: FileRef = await uploadFile(f, userId);
        await insert({ body: "", attachment_url: ref.url, attachment_name: ref.name, attachment_type: ref.type });
      } catch (err) { setError((err as Error).message); }
    }
    setUploading(false);
    if (picker.current) picker.current.value = "";
  }

  return (
    <div className="card flex flex-col h-[calc(100dvh-250px)] lg:h-[calc(100dvh-210px)] min-h-[420px]">
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-5 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center py-10 gap-3">
            <div className="anim-float"><Lia size={56} mood="smile" color="#A98BFF" /></div>
            <p className="text-muted text-[14px]">Aún no hay mensajes. Escribe el primero a {otherName}.</p>
          </div>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          const file = m.attachment_url ? { url: m.attachment_url, name: m.attachment_name ?? "Archivo", type: m.attachment_type ?? "" } : null;
          return (
            <div key={m.id} className={cn("flex anim-pop", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[82%] sm:max-w-[70%] rounded-[20px] px-3.5 py-2.5",
                mine ? "bg-brand text-white rounded-br-[6px]" : "bg-white text-ink rounded-bl-[6px]")}>
                {file && <div className={cn(m.body && "mb-2")}><FileView file={file} onDark={mine} /></div>}
                {m.body && <p className="whitespace-pre-wrap leading-relaxed break-words">{m.body}</p>}
                <p className={cn("text-[10px] mt-1", mine ? "text-white/70" : "text-muted")}>{fmtDateTime(m.created_at)}</p>
              </div>
            </div>
          );
        })}
        {uploading && <div className="flex justify-end"><div className="rounded-[20px] bg-brand/70 text-white text-[13px] px-4 py-2.5 animate-pulse">Subiendo archivo…</div></div>}
        <div ref={bottom} />
      </div>
      {error && <p className="px-4 pb-1 text-[13px] text-[#c03a77]">{error}</p>}
      <form onSubmit={send} className="p-2.5 sm:p-3 flex items-end gap-2">
        <button type="button" aria-label="Adjuntar archivo" onClick={() => picker.current?.click()} disabled={uploading}
          className="icon-btn shrink-0 cursor-pointer disabled:opacity-50">
          <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 11.5l-7.8 7.8a5 5 0 0 1-7.1-7.1l8.2-8.2a3.3 3.3 0 0 1 4.7 4.7l-8.2 8.2a1.7 1.7 0 0 1-2.4-2.4l7.5-7.5" /></svg>
        </button>
        <input ref={picker} type="file" multiple className="hidden" onChange={(e) => sendFiles(e.target.files)}
          accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.ai,.psd,.fig" />
        <textarea
          className="input resize-none h-11 py-2.5 min-w-0" rows={1} placeholder="Escribe un mensaje…" value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e); } }}
        />
        <button className="btn btn-primary h-11 px-4 shrink-0" disabled={sending || !text.trim()} aria-label="Enviar">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l16-8-6 16-2.5-6.5z" /><path d="M11.5 13.5L20 4" /></svg>
          <span className="hidden sm:inline">Enviar</span>
        </button>
      </form>
    </div>
  );
}
