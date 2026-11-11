/** Rubros (tipos de freelance) y lo que cambia en la app según cada uno */

export type SuggestedService = { name: string; unit: string; price: number; description?: string };
export type Rubro = {
  key: string;
  label: string;
  short: string;
  emoji: string;
  content: boolean; // trabaja con parrilla de redes sociales
  formats: string[]; // formatos de pieza más usados
  services: SuggestedService[];
};

export const UNITS: Record<string, string> = {
  pieza: "por pieza", hora: "por hora", dia: "por día", mes: "mensual", proyecto: "por proyecto",
  sesion: "por sesión", video: "por video", minuto: "por minuto", pagina: "por página", episodio: "por episodio",
};

export const RUBROS: Rubro[] = [
  { key: "marketing", label: "Marketing digital", short: "Marketing", emoji: "📈", content: true, formats: ["post", "carrusel", "reel", "historia"],
    services: [
      { name: "Estrategia de marketing digital", unit: "proyecto", price: 1500000 },
      { name: "Plan de contenidos mensual", unit: "mes", price: 900000 },
      { name: "Auditoría de marca y redes", unit: "proyecto", price: 600000 },
      { name: "Informe mensual de resultados", unit: "mes", price: 300000 },
    ] },
  { key: "community", label: "Community manager", short: "Community", emoji: "💬", content: true, formats: ["post", "carrusel", "reel", "historia"],
    services: [
      { name: "Gestión de redes (1 red)", unit: "mes", price: 1200000, description: "Planeación, publicación y respuesta a la comunidad" },
      { name: "Publicación adicional", unit: "pieza", price: 60000 },
      { name: "Gestión de comunidad (mensajes y comentarios)", unit: "mes", price: 400000 },
      { name: "Calendario de contenido", unit: "mes", price: 350000 },
    ] },
  { key: "grafico", label: "Diseño gráfico", short: "Diseño", emoji: "🎨", content: true, formats: ["post", "carrusel", "historia", "documento"],
    services: [
      { name: "Pieza gráfica para redes", unit: "pieza", price: 80000 },
      { name: "Carrusel (hasta 10 láminas)", unit: "pieza", price: 180000 },
      { name: "Diseño de logo", unit: "proyecto", price: 1200000 },
      { name: "Flyer o afiche", unit: "pieza", price: 150000 },
      { name: "Manual de marca", unit: "proyecto", price: 1800000 },
    ] },
  { key: "uxui", label: "Diseño UX/UI", short: "UX/UI", emoji: "📱", content: false, formats: ["pantalla", "web", "documento", "entrega"],
    services: [
      { name: "Diseño de pantalla (app o web)", unit: "pieza", price: 250000 },
      { name: "Prototipo interactivo", unit: "proyecto", price: 2500000 },
      { name: "Investigación UX y entrevistas", unit: "proyecto", price: 1500000 },
      { name: "Hora de diseño", unit: "hora", price: 80000 },
    ] },
  { key: "dev", label: "Programador / desarrollo web", short: "Desarrollo", emoji: "💻", content: false, formats: ["web", "pantalla", "entrega", "documento"],
    services: [
      { name: "Landing page", unit: "proyecto", price: 1800000 },
      { name: "Sitio web corporativo", unit: "proyecto", price: 4500000 },
      { name: "Hora de desarrollo", unit: "hora", price: 90000 },
      { name: "Mantenimiento web", unit: "mes", price: 350000 },
    ] },
  { key: "audiovisual", label: "Realizador audiovisual", short: "Audiovisual", emoji: "🎬", content: true, formats: ["reel", "video", "historia", "entrega"],
    services: [
      { name: "Video para redes (reel)", unit: "video", price: 350000 },
      { name: "Edición de video", unit: "minuto", price: 120000 },
      { name: "Video corporativo", unit: "proyecto", price: 2500000 },
      { name: "Día de grabación", unit: "dia", price: 900000 },
    ] },
  { key: "foto", label: "Fotógrafo", short: "Fotografía", emoji: "📷", content: true, formats: ["foto", "sesion", "carrusel", "post"],
    services: [
      { name: "Sesión de producto (hasta 20 fotos)", unit: "sesion", price: 600000 },
      { name: "Sesión de retrato", unit: "sesion", price: 350000 },
      { name: "Cobertura de evento", unit: "hora", price: 250000 },
      { name: "Foto editada adicional", unit: "pieza", price: 25000 },
    ] },
  { key: "copy", label: "Copywriter / redactor", short: "Copy", emoji: "✍️", content: true, formats: ["post", "articulo", "documento"],
    services: [
      { name: "Copy para publicación", unit: "pieza", price: 25000 },
      { name: "Artículo de blog", unit: "pieza", price: 120000 },
      { name: "Textos para página web", unit: "pagina", price: 180000 },
      { name: "Guion para video", unit: "video", price: 150000 },
    ] },
  { key: "ilustracion", label: "Ilustrador", short: "Ilustración", emoji: "🖌️", content: true, formats: ["post", "entrega", "documento"],
    services: [
      { name: "Ilustración sencilla", unit: "pieza", price: 150000 },
      { name: "Ilustración detallada", unit: "pieza", price: 450000 },
      { name: "Diseño de personaje o mascota", unit: "proyecto", price: 900000 },
    ] },
  { key: "motion", label: "Motion graphics / animación", short: "Motion", emoji: "✨", content: true, formats: ["reel", "video", "historia"],
    services: [
      { name: "Animación de logo", unit: "pieza", price: 350000 },
      { name: "Video animado (30 s)", unit: "video", price: 900000 },
      { name: "Pieza animada para redes", unit: "pieza", price: 200000 },
    ] },
  { key: "branding", label: "Branding / estrategia de marca", short: "Branding", emoji: "🧭", content: false, formats: ["documento", "entrega", "post"],
    services: [
      { name: "Naming", unit: "proyecto", price: 800000 },
      { name: "Estrategia de marca", unit: "proyecto", price: 2000000 },
      { name: "Identidad visual completa", unit: "proyecto", price: 3000000 },
    ] },
  { key: "ads", label: "Pauta digital / trafficker", short: "Pauta", emoji: "🎯", content: true, formats: ["post", "reel", "historia", "documento"],
    services: [
      { name: "Gestión de campañas en Meta Ads", unit: "mes", price: 700000 },
      { name: "Gestión de Google Ads", unit: "mes", price: 800000 },
      { name: "Configuración de píxel y analítica", unit: "proyecto", price: 300000 },
    ] },
  { key: "seo", label: "SEO / posicionamiento", short: "SEO", emoji: "🔎", content: false, formats: ["articulo", "documento", "web"],
    services: [
      { name: "Auditoría SEO", unit: "proyecto", price: 700000 },
      { name: "SEO mensual", unit: "mes", price: 900000 },
      { name: "Optimización de artículo", unit: "pieza", price: 80000 },
    ] },
  { key: "ugc", label: "Creador de contenido / UGC", short: "UGC", emoji: "🤳", content: true, formats: ["reel", "video", "historia"],
    services: [
      { name: "Video UGC", unit: "video", price: 250000 },
      { name: "Reseña o unboxing", unit: "video", price: 300000 },
    ] },
  { key: "audio", label: "Podcast / producción de audio", short: "Audio", emoji: "🎙️", content: false, formats: ["audio", "video", "entrega"],
    services: [
      { name: "Edición de episodio", unit: "episodio", price: 150000 },
      { name: "Producción completa de episodio", unit: "episodio", price: 400000 },
      { name: "Locución (hasta 1 min)", unit: "pieza", price: 120000 },
    ] },
  { key: "agencia", label: "Agencia / equipo creativo", short: "Agencia", emoji: "🏢", content: true, formats: ["post", "carrusel", "reel", "historia", "video"],
    services: [
      { name: "Fee mensual de agencia", unit: "mes", price: 3500000 },
      { name: "Proyecto integral de marca", unit: "proyecto", price: 5000000 },
    ] },
  { key: "otro", label: "Otro servicio creativo", short: "Otro", emoji: "💡", content: true, formats: [], services: [] },
];

export const rubroMap = Object.fromEntries(RUBROS.map((r) => [r.key, r])) as Record<string, Rubro>;

export const validRubros = (keys: unknown) =>
  (Array.isArray(keys) ? keys : []).map(String).filter((k) => k in rubroMap).slice(0, 8);

/** ¿Trabaja con redes sociales? Sin rubros elegidos asumimos que sí */
export const usesSocial = (keys: string[]) => !keys.length || keys.some((k) => rubroMap[k]?.content);

/** Cómo llamar a la "parrilla" según lo que hace */
export const workLabel = (keys: string[]) => (usesSocial(keys) ? "Parrilla" : "Entregas");
export const workTitle = (keys: string[]) => (usesSocial(keys) ? "Parrilla de contenido" : "Entregas y proyectos");
export const pieceWord = (keys: string[]) => (usesSocial(keys) ? "pieza" : "entrega");

/** Formatos más relevantes primero */
export function rankedFormats(keys: string[], all: Record<string, string>) {
  const pref = [...new Set(keys.flatMap((k) => rubroMap[k]?.formats ?? []))];
  const rest = Object.keys(all).filter((f) => !pref.includes(f));
  return [...pref.filter((f) => f in all), ...rest];
}

export const suggestedServices = (keys: string[]) =>
  keys.flatMap((k) => (rubroMap[k]?.services ?? []).map((s) => ({ ...s, category: k })));

export type Settings = {
  quote_valid_days?: number;
  quote_notes?: string;
  invoice_due_days?: number;
  invoice_notes?: string;
  networks?: string[];
  rounds_included?: number;
};

export const DEFAULT_SETTINGS: Required<Settings> = {
  quote_valid_days: 15,
  quote_notes: "50% de anticipo para iniciar y 50% contra entrega.\nIncluye 2 rondas de ajustes.",
  invoice_due_days: 15,
  invoice_notes: "No soy responsable de IVA.",
  networks: [],
  rounds_included: 2,
};

export const withDefaults = (s?: Settings | null): Required<Settings> => ({ ...DEFAULT_SETTINGS, ...(s ?? {}) });
