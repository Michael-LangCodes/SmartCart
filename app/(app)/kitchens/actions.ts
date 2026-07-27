"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_KITCHEN_COOKIE } from "@/lib/kitchen";

async function setActiveCookie(kitchenId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_KITCHEN_COOKIE, kitchenId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

export type KitchenState = { error?: string };

export async function createKitchen(
  _prev: KitchenState,
  formData: FormData,
): Promise<KitchenState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Please enter a kitchen name." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: kitchen, error } = await supabase
    .from("kitchens")
    .insert({ name, created_by: user.id })
    .select("id")
    .single();
  if (error || !kitchen) return { error: error?.message ?? "Could not create kitchen." };

  const { error: memberError } = await supabase
    .from("kitchen_members")
    .insert({ kitchen_id: kitchen.id, user_id: user.id, role: "owner" });
  if (memberError) return { error: memberError.message };

  await setActiveCookie(kitchen.id);
  revalidatePath("/kitchens");
  redirect("/kitchens");
}

export async function joinKitchen(
  _prev: KitchenState,
  formData: FormData,
): Promise<KitchenState> {
  const code = String(formData.get("invite_code") ?? "").trim();
  if (!code) return { error: "Please enter an invite code." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: kitchenId, error } = await supabase.rpc(
    "join_kitchen_by_code",
    { _invite_code: code },
  );
  if (error) return { error: "Invalid invite code." };

  if (kitchenId) await setActiveCookie(kitchenId as string);
  revalidatePath("/kitchens");
  redirect("/kitchens");
}

export async function leaveKitchen(formData: FormData): Promise<void> {
  const kitchenId = String(formData.get("kitchenId") ?? "");
  if (!kitchenId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("kitchen_members")
    .delete()
    .eq("kitchen_id", kitchenId)
    .eq("user_id", user.id);

  revalidatePath("/kitchens");
}

export async function deleteKitchen(formData: FormData): Promise<void> {
  const kitchenId = String(formData.get("kitchenId") ?? "");
  if (!kitchenId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("kitchens")
    .delete()
    .eq("id", kitchenId)
    .eq("created_by", user.id);

  revalidatePath("/kitchens");
}
