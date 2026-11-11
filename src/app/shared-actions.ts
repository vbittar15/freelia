"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addComment(formData: FormData) {
  const supabase = await createClient();
  const post_id = String(formData.get("post_id"));
  const body = String(formData.get("body") || "").trim();
  const path = String(formData.get("path") || "/");
  if (body) await supabase.from("post_comments").insert({ post_id, body });
  revalidatePath(path);
}

export async function markAllRead(formData: FormData) {
  const supabase = await createClient();
  await supabase.rpc("mark_notifications_read");
  revalidatePath(String(formData.get("path") || "/"), "layout");
}
