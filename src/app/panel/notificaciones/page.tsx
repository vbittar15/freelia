import { requireCreative } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { NotificationList } from "@/components/shared";
import type { Notification } from "@/lib/types";

export const metadata = { title: "Notificaciones" };

export default async function Page() {
  const { supabase, user } = await requireCreative();
  const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
  return (
    <>
      <PageHeader title="Notificaciones" />
      <NotificationList items={(data ?? []) as Notification[]} path="/panel/notificaciones" />
    </>
  );
}
