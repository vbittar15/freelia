/** Clave pública VAPID (es pública por diseño; la privada vive en Vercel) */
export const VAPID_PUBLIC_KEY =
  "BPSp9hXF1ETt1TMjxutzUz2kG0oSo3WuErmwnsFIWavnKFtdfkCq1tMK2nDJqPKMsyOtaa64PBYglOqHxjONdC8";

export function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
