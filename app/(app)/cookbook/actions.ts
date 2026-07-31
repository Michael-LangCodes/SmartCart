"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function revalidateCookbook(recipeId: string) {
  revalidatePath("/cookbook");
  revalidatePath(`/cookbook/${recipeId}`);
}

async function requireSignedInUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/** Upsert a 1–5 star rating on a public cookbook recipe. */
export async function rateRecipe(formData: FormData): Promise<void> {
  const recipeId = String(formData.get("recipe_id") ?? "").trim();
  const ratingRaw = Number(formData.get("rating"));
  if (!recipeId || !Number.isInteger(ratingRaw) || ratingRaw < 1 || ratingRaw > 5) {
    return;
  }

  const { supabase, user } = await requireSignedInUser();
  if (user.is_anonymous) {
    redirect(
      `/login?redirect=${encodeURIComponent(`/cookbook/${recipeId}`)}`,
    );
  }

  const { data: recipe } = await supabase
    .from("recipes")
    .select("id, is_public")
    .eq("id", recipeId)
    .eq("is_public", true)
    .maybeSingle();
  if (!recipe) return;

  await supabase.from("recipe_ratings").upsert(
    {
      recipe_id: recipeId,
      user_id: user.id,
      rating: ratingRaw,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "recipe_id,user_id" },
  );

  revalidateCookbook(recipeId);
}

/** Post a comment on a public cookbook recipe. */
export async function addRecipeComment(formData: FormData): Promise<void> {
  const recipeId = String(formData.get("recipe_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!recipeId || body.length < 1 || body.length > 2000) return;

  const { supabase, user } = await requireSignedInUser();
  if (user.is_anonymous) {
    redirect(
      `/login?redirect=${encodeURIComponent(`/cookbook/${recipeId}`)}`,
    );
  }

  const { data: recipe } = await supabase
    .from("recipes")
    .select("id, is_public")
    .eq("id", recipeId)
    .eq("is_public", true)
    .maybeSingle();
  if (!recipe) return;

  await supabase.from("recipe_comments").insert({
    recipe_id: recipeId,
    user_id: user.id,
    body,
  });

  revalidateCookbook(recipeId);
}

/** Delete one of your own comments. */
export async function deleteRecipeComment(formData: FormData): Promise<void> {
  const commentId = String(formData.get("comment_id") ?? "").trim();
  const recipeId = String(formData.get("recipe_id") ?? "").trim();
  if (!commentId) return;

  const { supabase, user } = await requireSignedInUser();

  await supabase
    .from("recipe_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (recipeId) revalidateCookbook(recipeId);
  else revalidatePath("/cookbook");
}
