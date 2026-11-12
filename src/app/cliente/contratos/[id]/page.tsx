import { createHash } from "node:crypto";
import { notFound } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { Notice, PageHeader } from "@/components/ui";
import { PrintButton } from "@/components/client-ui";
import { ContractDocument } from "@/components/contract-doc";
import { SignPad } from "@/components/sign-pad";
import { Lia } from "@/components/brand";
import type { Contract } from "@/lib/types";
import { signContract } from "../../actions";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const { ok, error } = await searchParams;
  const { supabase, profile } = await requireClient();
  const { data } = await supabase.from("contracts").select("*").eq("id", id).single();
  if (!data) notFound();
  const k = data as Contract;
  const { data: iss } = await supabase.from("profiles").select("full_name, business_name, document_id, city, phone, email, bank_info, logo_url, brand_color").eq("id", k.owner_id).single();
  const hash = createHash("sha256").update(k.body, "utf8").digest("hex");

  return (
    <>
      <PageHeader back={{ href: "/cliente/contratos", label: "Contratos" }} title={`Contrato N.º ${k.number}`} actions={k.status === "firmado" ? <PrintButton /> : undefined} />
      {ok && <div className="mb-5 no-print"><Notice tone="ok">¡Listo! Firmaste el contrato. Tu equipo creativo ya recibió la copia firmada.</Notice></div>}
      {error && <div className="mb-5 no-print"><Notice tone="error">{error}</Notice></div>}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <ContractDocument k={k} issuer={iss} />
        <aside className="no-print lg:sticky lg:top-6">
          {k.status === "enviado" ? (
            <div className="card p-5 sm:p-6">
              <div className="flex gap-3 items-center mb-4">
                <Lia size={40} mood="smile" />
                <div><div className="font-semibold text-[17px]">Firma tu contrato</div><div className="text-[13px] text-muted">Léelo completo antes de firmar.</div></div>
              </div>
              <SignPad action={signContract} contractId={k.id} hash={hash} defaultName={profile.full_name ?? ""} />
            </div>
          ) : k.status === "firmado" ? (
            <div className="rounded-[22px] bg-verde-t p-5">
              <div className="font-semibold">Contrato firmado</div>
              <p className="text-[13px] text-muted mt-1">Guárdalo en PDF con el botón Imprimir.</p>
            </div>
          ) : (
            <div className="rounded-[22px] bg-surface p-5 text-[14px] text-muted">Este contrato fue anulado.</div>
          )}
        </aside>
      </div>
    </>
  );
}
