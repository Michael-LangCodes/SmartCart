"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_KITCHEN_COOKIE } from "@/lib/kitchen";
import {
  isDietType,
  parseAllergies,
  parseServingMultiplier,
} from "@/lib/diet";

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

function parseFavoriteIds(formData: FormData): string[] {
  return Array.from(
    new Set(
      ["fav_1", "fav_2", "fav_3"]
        .map((key) => String(formData.get(key) ?? "").trim())
        .filter(Boolean),
    ),
  ).slice(0, 3);
}

export type PersonState = { error?: string };

/** Add a non-account household person to a kitchen. */
export async function addKitchenPerson(
  _prev: PersonState,
  formData: FormData,
): Promise<PersonState> {
  const kitchenId = String(formData.get("kitchenId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!kitchenId || !name) return { error: "Name is required." };

  const dietRaw = String(formData.get("diet_type") ?? "all");
  const diet_type = isDietType(dietRaw) ? dietRaw : "all";
  const allergies = parseAllergies(String(formData.get("allergies") ?? ""));
  const serving_multiplier = parseServingMultiplier(
    String(formData.get("serving_multiplier") ?? "1"),
  );
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const favorites = parseFavoriteIds(formData);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: person, error } = await supabase
    .from("kitchen_people")
    .insert({
      kitchen_id: kitchenId,
      name,
      diet_type,
      allergies,
      serving_multiplier,
      notes,
    })
    .select("id")
    .single();

  if (error || !person) return { error: error?.message ?? "Could not add person." };

  if (favorites.length > 0) {
    await supabase.from("kitchen_person_favorites").insert(
      favorites.map((recipe_id, i) => ({
        person_id: person.id,
        recipe_id,
        position: i + 1,
      })),
    );
  }

  revalidatePath("/kitchens");
  return {};
}

export async function updateKitchenPerson(
  _prev: PersonState,
  formData: FormData,
): Promise<PersonState> {
  const personId = String(formData.get("personId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!personId || !name) return { error: "Name is required." };

  const dietRaw = String(formData.get("diet_type") ?? "all");
  const diet_type = isDietType(dietRaw) ? dietRaw : "all";
  const allergies = parseAllergies(String(formData.get("allergies") ?? ""));
  const serving_multiplier = parseServingMultiplier(
    String(formData.get("serving_multiplier") ?? "1"),
  );
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const favorites = parseFavoriteIds(formData);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("kitchen_people")
    .update({ name, diet_type, allergies, serving_multiplier, notes })
    .eq("id", personId);

  if (error) return { error: error.message };

  await supabase
    .from("kitchen_person_favorites")
    .delete()
    .eq("person_id", personId);

  if (favorites.length > 0) {
    const { error: favError } = await supabase
      .from("kitchen_person_favorites")
      .insert(
        favorites.map((recipe_id, i) => ({
          person_id: personId,
          recipe_id,
          position: i + 1,
        })),
      );
    if (favError) return { error: favError.message };
  }

  revalidatePath("/kitchens");
  return {};
}

export async function deleteKitchenPerson(formData: FormData): Promise<void> {
  const personId = String(formData.get("personId") ?? "");
  if (!personId) return;

  const supabase = await createClient();
  await supabase.from("kitchen_people").delete().eq("id", personId);
  revalidatePath("/kitchens");
}
