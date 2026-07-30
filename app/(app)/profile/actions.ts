"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  isDietType,
  parseAllergies,
  parseServingMultiplier,
} from "@/lib/diet";

export type ProfileState = { error?: string; message?: string };

function parseFavoriteIds(formData: FormData): string[] | { error: string } {
  const ids = ["fav_1", "fav_2", "fav_3"]
    .map((key) => String(formData.get(key) ?? "").trim())
    .filter(Boolean);
  if (new Set(ids).size !== ids.length) {
    return { error: "Each favorite meal can only be selected once." };
  }
  return ids.slice(0, 3);
}

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName = String(formData.get("display_name") ?? "").trim();
  const dietRaw = String(formData.get("diet_type") ?? "all");
  const diet_type = isDietType(dietRaw) ? dietRaw : "all";
  const allergies = parseAllergies(String(formData.get("allergies") ?? ""));
  const serving_multiplier = parseServingMultiplier(
    String(formData.get("serving_multiplier") ?? "1"),
  );
  const favoritesResult = parseFavoriteIds(formData);
  if ("error" in favoritesResult) return favoritesResult;
  const favorites = favoritesResult;

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName || null,
      diet_type,
      allergies,
      serving_multiplier,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  // Replace favorites (positions 1..n).
  await supabase
    .from("profile_favorite_recipes")
    .delete()
    .eq("profile_id", user.id);

  if (favorites.length > 0) {
    const { error: favError } = await supabase
      .from("profile_favorite_recipes")
      .insert(
        favorites.map((recipe_id, i) => ({
          profile_id: user.id,
          recipe_id,
          position: i + 1,
        })),
      );
    if (favError) return { error: favError.message };
  }

  revalidatePath("/profile");
  revalidatePath("/kitchens");
  return { message: "Profile saved." };
}
