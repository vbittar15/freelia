import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import { VAPID_PUBLIC_KEY } from "@/lib/push";

export const runtime = "nodejs";

type Sub = { endpoint: string; keys: { p256dh: string; auth: string } };

/** La base de datos llama esta ruta cuando se crea una notificación */
export async function POST(req: Request) {
  const secret = process.env.PUSH_SECRET;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!secret || !priv || req.headers.get("x-push-secret") !== secret) {
    return new Response("No autorizado", { status: 401 });
  }
  const { title, body, link, tag, subscriptions } = (await req.json()) as {
    title: string; body: string; link: string; tag?: string; subscriptions: Sub[];
  };

  webpush.setVapidDetails("mailto:hola@freelia.app", VAPID_PUBLIC_KEY, priv);
  const payload = JSON.stringify({ title, body, link, tag });
  const gone: string[] = [];

  await Promise.all(
    (subscriptions ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(s, payload, { TTL: 60 * 60 * 24 });
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) gone.push(s.endpoint);
      }
    })
  );

  if (gone.length) {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    await supabase.rpc("remove_push_subscriptions", { p_secret: secret, p_endpoints: gone });
  }
  return Response.json({ sent: (subscriptions?.length ?? 0) - gone.length, removed: gone.length });
}
