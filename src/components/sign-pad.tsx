"use client";

import { useEffect, useRef, useState } from "react";
import { SubmitButton } from "./client-ui";
import { Icon } from "./icons";

/** Firma con el dedo o el mouse + datos del firmante */
export function SignPad({ action, contractId, hash, defaultName }: { action: (f: FormData) => void; contractId: string; hash: string; defaultName: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState("");
  const [accept, setAccept] = useState(false);
  const drawing = useRef(false);
  const strokes = useRef(0);

  useEffect(() => {
    const c = canvas.current!;
    const resize = () => {
      const r = c.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
      c.width = r.width * dpr; c.height = r.height * dpr;
      const ctx = c.getContext("2d")!; ctx.scale(dpr, dpr);
      ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#221a3a";
      setData(""); strokes.current = 0;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const pos = (e: React.PointerEvent) => { const r = canvas.current!.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] as const; };
  function down(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = canvas.current!.getContext("2d")!; const [x, y] = pos(e);
    ctx.beginPath(); ctx.moveTo(x, y);
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    const ctx = canvas.current!.getContext("2d")!; const [x, y] = pos(e);
    ctx.lineTo(x, y); ctx.stroke(); strokes.current++;
  }
  function up() {
    if (!drawing.current) return;
    drawing.current = false;
    if (strokes.current > 8) setData(canvas.current!.toDataURL("image/png"));
  }
  function clear() {
    const c = canvas.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setData(""); strokes.current = 0;
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={contractId} />
      <input type="hidden" name="hash" value={hash} />
      <input type="hidden" name="signature" value={data} />
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block"><span className="label">Nombre completo *</span>
          <input name="name" required defaultValue={defaultName} className="input" autoComplete="name" /></label>
        <label className="block"><span className="label">Cédula o NIT *</span>
          <input name="doc" required className="input" inputMode="numeric" /></label>
      </div>
      <div>
        <div className="flex items-center justify-between px-1 mb-1.5">
          <span className="text-[12px] font-medium text-muted">Firma aquí con tu dedo o el mouse *</span>
          <button type="button" onClick={clear} className="text-[13px] font-semibold text-brand-dark inline-flex items-center gap-1"><Icon name="x" className="size-3.5" /> Borrar</button>
        </div>
        <canvas ref={canvas} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
          className="w-full h-44 rounded-[18px] bg-white ring-2 ring-dashed ring-line touch-none cursor-crosshair" aria-label="Espacio para firmar" />
      </div>
      <label className="flex items-start gap-3 text-[14px] cursor-pointer">
        <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="size-4 mt-1 accent-[#3d5bf5]" />
        <span>Leí el contrato completo y acepto firmarlo electrónicamente. Entiendo que esta firma tiene la misma validez que una firma a mano.</span>
      </label>
      <SubmitButton className={`btn btn-lg w-full ${data && accept ? "btn-primary" : "bg-surface text-muted pointer-events-none"}`} pendingText="Firmando…">
        {!data ? "Dibuja tu firma para continuar" : !accept ? "Acepta para firmar" : "Firmar contrato"}
      </SubmitButton>
    </form>
  );
}
