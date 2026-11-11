"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children, className = "btn btn-primary", pendingText = "Guardando…", name, value,
}: { children: React.ReactNode; className?: string; pendingText?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} name={name} value={value}>
      {pending ? pendingText : children}
    </button>
  );
}

/** Botón que pide confirmación antes de enviar el formulario */
export function ConfirmSubmit({ children, message, className }: { children: React.ReactNode; message: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn("btn btn-danger btn-sm", className)}
      onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}
    >
      {children}
    </button>
  );
}

export function PrintButton() {
  return (
    <button type="button" className="btn btn-soft no-print" onClick={() => window.print()}>
      Descargar PDF
    </button>
  );
}

export function CopyButton({ text, label = "Copiar enlace" }: { text: string; label?: string }) {
  return (
    <button
      type="button"
      className="btn btn-soft btn-sm"
      onClick={async (e) => {
        const btn = e.currentTarget;
        await navigator.clipboard.writeText(text);
        const old = btn.textContent;
        btn.textContent = "¡Copiado!";
        setTimeout(() => (btn.textContent = old), 1500);
      }}
    >
      {label}
    </button>
  );
}
