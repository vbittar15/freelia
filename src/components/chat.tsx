"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import type { Message } from "@/lib/types";
import { cn, fmtDateTime } from "@/lib/utils";

/** Chat en tiempo real de una conversación (una por cliente) */
export function Chat({
  clientId, userId, initial, otherName,
}: { clientId: string; userId: string; initial: Message[]; otherName: string }) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

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

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    const { data, error } = await createClient()
      .from("messages").insert({ client_id: clientId, body }).select().single();
    if (!error && data) {
      setMessages((arr) => (arr.some((x) => x.id === data.id) ? arr : [...arr, data as Message]));
      setText("");
    }
    setSending(false);
  }

  return (
    <div className="card flex flex-col h-[calc(100vh-260px)] md:h-[calc(100vh-220px)] min-h-[420px]">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-muted text-[13px] py-10">Aún no hay mensajes. Escribe el primero a {otherName}.</p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[78%] rounded-2xl px-4 py-2.5",
                mine ? "bg-brand text-white rounded-br-md" : "bg-surface text-ink rounded-bl-md")}>
                <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                <p className={cn("text-[10px] mt-1", mine ? "text-white/70" : "text-muted")}>{fmtDateTime(m.created_at)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      <form onSubmit={send} className="border-t border-line p-3 flex gap-2">
        <textarea
          className="input resize-none h-11 py-2.5" rows={1} placeholder="Escribe un mensaje…" value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e); } }}
        />
        <button className="btn btn-primary h-11" disabled={sending || !text.trim()}>Enviar</button>
      </form>
    </div>
  );
}
