import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Kitchen } from "@/lib/types";

export const ACTIVE_KITCHEN_COOKIE = "sc_kitchen";

/** All kitchens the current user is a member of, newest first. */
export async function getMyKitchens(): Promise<Kitchen[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kitchen_members")
    .select("kitchens(*)")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data
    .map((row) => (row as unknown as { kitchens: Kitchen | null }).kitchens)
    .filter((k): k is Kitchen => Boolean(k));
}

/**
 * Resolve the active kitchen: the one stored in the cookie if the user is
 * still a member, otherwise the first kitchen they belong to (or null).
 */
export async function getActiveKitchen(
  kitchens?: Kitchen[],
): Promise<Kitchen | null> {
  const list = kitchens ?? (await getMyKitchens());
  if (list.length === 0) return null;

  const cookieStore = await cookies();
  const selected = cookieStore.get(ACTIVE_KITCHEN_COOKIE)?.value;
  const match = list.find((k) => k.id === selected);
  return match ?? list[0];
}
