import type { Client, ModuleKey } from "./types";
import { usesSocial } from "./rubros";

export const MODULES: { key: ModuleKey; label: string; hint: string }[] = [
  { key: "parrilla", label: "Parrilla de contenido", hint: "Calendario de publicaciones para redes" },
  { key: "solicitudes", label: "Solicitudes", hint: "Que te pida piezas, proyectos o reuniones" },
  { key: "cotizaciones", label: "Cotizaciones", hint: "Enviarle propuestas para aceptar" },
  { key: "cobros", label: "Cuentas de cobro", hint: "Cobrar y registrar sus pagos" },
  { key: "contratos", label: "Contratos", hint: "Firmar contratos desde la app" },
  { key: "chat", label: "Mensajes", hint: "Chat directo contigo" },
];

export const defaultModules = (specialties: string[]): Record<ModuleKey, boolean> => ({
  parrilla: usesSocial(specialties), solicitudes: true, cotizaciones: true, cobros: true, contratos: true, chat: true,
});

/** ¿Este módulo está activo para el cliente? (si no está definido, sí) */
export const hasModule = (c: Pick<Client, "modules"> | null | undefined, k: ModuleKey) => c?.modules?.[k] !== false;
