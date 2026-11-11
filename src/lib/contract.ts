/** Contrato integral de prestación de servicios (modelo para Colombia) */
import type { Client, ClientService, ContractTerms, Profile } from "./types";
import { money, numberToWords } from "./utils";
import { rubroMap, withDefaults } from "./rubros";

const longDate = (iso: string) =>
  new Date(iso + (iso.length === 10 ? "T12:00:00" : "")).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
const pesos = (n: number) => `${numberToWords(n)} pesos (${money(n)})`;

export function defaultTerms(profile: Profile): Required<ContractTerms> {
  const s = withDefaults(profile.settings);
  const today = new Date(Date.now() - 5 * 3600000).toISOString().slice(0, 10);
  return { start: today, months: 6, pay_day: 5, advance: 50, notice_days: 15, rounds: s.rounds_included, due_days: s.invoice_due_days, city: profile.city || "Barranquilla" };
}

export function buildContract(opts: {
  creative: Profile; client: Pick<Client, "name" | "company" | "document_id" | "email">;
  services: Pick<ClientService, "name" | "includes" | "qty" | "price" | "period">[]; terms: Required<ContractTerms>;
}) {
  const { creative, client, services, terms: t } = opts;
  const brand = creative.business_name || creative.full_name || "EL CONTRATISTA";
  const oficio = (creative.specialties ?? []).map((k) => rubroMap[k]?.label.toLowerCase()).filter(Boolean).join(", ") || "servicios creativos";
  const contratante = client.company ? `${client.company}, representada por ${client.name}` : client.name;
  const monthly = services.filter((s) => s.period === "mensual");
  const once = services.filter((s) => s.period === "unico");
  const totalM = monthly.reduce((a, s) => a + Number(s.price) * Number(s.qty), 0);
  const totalU = once.reduce((a, s) => a + Number(s.price) * Number(s.qty), 0);
  const line = (s: (typeof services)[number]) =>
    `- ${Number(s.qty) !== 1 ? `${s.qty} × ` : ""}${s.name}${s.includes ? `: ${s.includes.replace(/\s*\n\s*/g, "; ")}` : ""} — ${money(Number(s.price) * Number(s.qty))}${s.period === "mensual" ? " al mes" : " (pago único)"}`;

  const L: string[] = [];
  L.push(`Entre ${creative.full_name || brand}${creative.document_id ? `, identificado(a) con documento ${creative.document_id}` : ""}, quien actúa en nombre propio${creative.business_name ? ` bajo la marca ${creative.business_name}` : ""}, en adelante EL CONTRATISTA, y ${contratante}${client.document_id ? `, identificado(a) con NIT o cédula ${client.document_id}` : ""}, en adelante EL CONTRATANTE, acuerdan celebrar el presente contrato de prestación de servicios, que se regirá por las siguientes cláusulas:`);

  L.push("## Primera. Objeto");
  L.push(`EL CONTRATISTA prestará a EL CONTRATANTE servicios de ${oficio}, con autonomía técnica y administrativa, de acuerdo con el alcance descrito en la cláusula segunda.`);

  L.push("## Segunda. Alcance de los servicios");
  if (services.length) {
    L.push("Los servicios contratados son:");
    services.forEach((s) => L.push(line(s)));
  } else {
    L.push("Los servicios y entregables se definirán en cada solicitud o cotización aceptada por EL CONTRATANTE a través de la plataforma Freelia, las cuales hacen parte integral de este contrato.");
  }
  L.push("Cualquier servicio adicional no descrito aquí se cotizará por separado y solo se ejecutará con aprobación previa de EL CONTRATANTE.");

  L.push("## Tercera. Valor y forma de pago");
  if (totalM) L.push(`Por los servicios mensuales, EL CONTRATANTE pagará la suma de ${pesos(totalM)} cada mes, dentro de los primeros ${t.pay_day} días de cada periodo, previa presentación de la cuenta de cobro.`);
  if (totalU) L.push(`Por los servicios de pago único, EL CONTRATANTE pagará la suma de ${pesos(totalU)}: el ${t.advance}% como anticipo para iniciar y el saldo contra entrega del material aprobado.`);
  if (!totalM && !totalU) L.push("El valor de cada servicio será el de la cotización aceptada por EL CONTRATANTE.");
  L.push(`Las cuentas de cobro se pagarán dentro de los ${t.due_days} días siguientes a su envío. El pago se hará por transferencia a la cuenta que EL CONTRATISTA indique en la cuenta de cobro. Los valores no incluyen costos de pauta, impresión, licencias de terceros ni gastos de desplazamiento, salvo que se indique lo contrario.`);

  L.push("## Cuarta. Duración");
  L.push(t.months
    ? `El contrato inicia el ${longDate(t.start)} y tendrá una duración de ${t.months} ${t.months === 1 ? "mes" : "meses"}. Si ninguna de las partes manifiesta lo contrario antes de su vencimiento, se renovará por periodos iguales.`
    : `El contrato inicia el ${longDate(t.start)} y estará vigente hasta que alguna de las partes lo dé por terminado según la cláusula décima.`);

  L.push("## Quinta. Aprobaciones y rondas de cambios");
  L.push(`El material se presentará a EL CONTRATANTE a través de la plataforma Freelia, donde podrá aprobarlo o pedir cambios. Cada pieza incluye ${t.rounds} ${t.rounds === 1 ? "ronda" : "rondas"} de cambios sin costo adicional; las rondas adicionales o los cambios que modifiquen lo ya aprobado podrán cobrarse aparte. Si EL CONTRATANTE no responde una solicitud de aprobación en cinco (5) días hábiles, EL CONTRATISTA podrá reprogramar las fechas de entrega o publicación afectadas.`);

  L.push("## Sexta. Obligaciones de EL CONTRATISTA");
  L.push("- Prestar los servicios con calidad, diligencia y dentro de los tiempos acordados.");
  L.push("- Presentar el material para aprobación antes de su publicación o entrega final.");
  L.push("- Entregar los archivos finales una vez aprobados y pagados.");
  L.push("- Guardar reserva sobre la información de EL CONTRATANTE.");

  L.push("## Séptima. Obligaciones de EL CONTRATANTE");
  L.push("- Entregar oportunamente la información, accesos, logos, textos y materiales necesarios.");
  L.push("- Revisar y responder las solicitudes de aprobación en los plazos acordados.");
  L.push("- Pagar los valores pactados en las fechas establecidas.");
  L.push("- Garantizar que los materiales que entrega no infringen derechos de terceros.");

  L.push("## Octava. Propiedad intelectual");
  L.push("Una vez pagado el valor total de cada entregable, EL CONTRATISTA cede a EL CONTRATANTE los derechos patrimoniales de autor sobre el material final aprobado, para su uso en cualquier medio, sin límite de tiempo ni territorio. Los bocetos, propuestas no aprobadas y archivos de trabajo seguirán siendo de EL CONTRATISTA, salvo acuerdo distinto. EL CONTRATISTA conserva sus derechos morales y podrá mostrar el trabajo en su portafolio, salvo que EL CONTRATANTE solicite lo contrario por escrito.");

  L.push("## Novena. Confidencialidad y datos personales");
  L.push("Las partes mantendrán en reserva la información confidencial que conozcan con ocasión de este contrato, durante su vigencia y dos (2) años más. Los datos personales se tratarán conforme a la Ley 1581 de 2012 y solo para los fines de este contrato.");

  L.push("## Décima. Terminación");
  L.push(`Cualquiera de las partes podrá terminar el contrato avisando por escrito con ${t.notice_days} días de anticipación. EL CONTRATANTE pagará los servicios prestados y el material entregado hasta la fecha de terminación. También podrá terminarse de inmediato por incumplimiento grave de cualquiera de las partes.`);

  L.push("## Undécima. Independencia");
  L.push("EL CONTRATISTA actúa con plena autonomía e independencia. Este contrato no genera relación laboral ni subordinación entre las partes, y cada una asume sus propias obligaciones tributarias y de seguridad social.");

  L.push("## Duodécima. Firma electrónica y comunicaciones");
  L.push("Las partes aceptan firmar este contrato de forma electrónica a través de la plataforma Freelia, con plena validez de acuerdo con la Ley 527 de 1999 y el Decreto 2364 de 2012. Como evidencia se registran el nombre, el documento, el trazo de la firma, la fecha, la hora y la huella digital del texto firmado. Las aprobaciones, solicitudes y mensajes enviados por la plataforma se consideran comunicaciones válidas entre las partes.");

  L.push("## Decimotercera. Domicilio y controversias");
  L.push(`Para todos los efectos, el domicilio contractual es la ciudad de ${t.city}. Las diferencias se intentarán resolver primero de forma directa y amistosa; de no lograrse, se acudirá a los mecanismos previstos por la ley colombiana.`);

  return { title: `Contrato de prestación de servicios — ${client.company || client.name}`, body: L.join("\n\n") };
}

/** Bloques para mostrar el contrato */
export type Block = { kind: "h" | "p" | "li"; text: string };
export function parseBody(body: string): Block[] {
  return body.split(/\n+/).map((l) => l.trim()).filter(Boolean).map((l) =>
    l.startsWith("## ") ? { kind: "h", text: l.slice(3) } : l.startsWith("- ") ? { kind: "li", text: l.slice(2) } : { kind: "p", text: l });
}

export async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
