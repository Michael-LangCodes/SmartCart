"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDifficulty, parseTags } from "@/lib/recipe-meta";

type ParsedIngredient = {
  name: string;
  quantity: number | null;
  unit: string | null;
  position: number;
};

function parseOptionalInt(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function parseIngredients(formData: FormData): ParsedIngredient[] {
  const names = formData.getAll("ing_name").map(String);
  const quantities = formData.getAll("ing_qty").map(String);
  const units = formData.getAll("ing_unit").map(String);

  const rows: ParsedIngredient[] = [];
  names.forEach((rawName, i) => {
    const name = rawName.trim();
    if (!name) return;
    const qtyRaw = (quantities[i] ?? "").trim();
    const qty = qtyRaw === "" ? null : Number(qtyRaw);
    rows.push({
      name,
      quantity: qty !== null && Number.isFinite(qty) ? qty : null,
      unit: (units[i] ?? "").trim() || null,
      position: rows.length,
    });
  });
  return rows;
}

/** Create a new recipe, or update an existing one when `id` is present. */
export async function saveRecipe(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const instructions =
    String(formData.get("instructions") ?? "").trim() || null;
  const servingsRaw = String(formData.get("servings") ?? "").trim();
  const servings = servingsRaw === "" ? null : Number(servingsRaw);
  const difficultyRaw = String(formData.get("difficulty") ?? "").trim();
  const difficulty = isDifficulty(difficultyRaw) ? difficultyRaw : null;
  const prep_minutes = parseOptionalInt(
    String(formData.get("prep_minutes") ?? ""),
  );
  const cook_minutes = parseOptionalInt(
    String(formData.get("cook_minutes") ?? ""),
  );
  const calories = parseOptionalNumber(String(formData.get("calories") ?? ""));
  const protein_g = parseOptionalNumber(
    String(formData.get("protein_g") ?? ""),
  );
  const carbs_g = parseOptionalNumber(String(formData.get("carbs_g") ?? ""));
  const fat_g = parseOptionalNumber(String(formData.get("fat_g") ?? ""));
  const fiber_g = parseOptionalNumber(String(formData.get("fiber_g") ?? ""));
  const imageRaw = String(formData.get("image_url") ?? "").trim();
  const image_url =
    imageRaw === ""
      ? null
      : /^https?:\/\//i.test(imageRaw) && imageRaw.length <= 2000
        ? imageRaw
        : null;
  const isPublic = formData.get("is_public") === "on";
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const ingredients = parseIngredients(formData);

  if (!title) return;

  const payload = {
    title,
    description,
    instructions,
    servings: servings !== null && Number.isFinite(servings) ? servings : null,
    difficulty,
    prep_minutes,
    cook_minutes,
    calories,
    protein_g,
    carbs_g,
    fat_g,
    fiber_g,
    image_url,
    tags,
    is_public: isPublic,
  };

  let recipeId = id;

  if (id) {
    await supabase
      .from("recipes")
      .update(payload)
      .eq("id", id)
      .eq("owner_id", user.id);

    // Replace the ingredient set.
    await supabase.from("recipe_ingredients").delete().eq("recipe_id", id);
  } else {
    const { data, error } = await supabase
      .from("recipes")
      .insert({
        owner_id: user.id,
        origin: "user",
        source_recipe_id: null,
        ...payload,
      })
      .select("id")
      .single();
    if (error || !data) return;
    recipeId = data.id;
  }

  if (ingredients.length > 0) {
    await supabase.from("recipe_ingredients").insert(
      ingredients.map((ing) => ({ ...ing, recipe_id: recipeId })),
    );
  }

  revalidatePath("/recipes");
  revalidatePath("/cookbook");
  redirect("/recipes");
}

export async function deleteRecipe(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("recipes").delete().eq("id", id).eq("owner_id", user.id);
  revalidatePath("/recipes");
}

/** Copy a public recipe (and its ingredients) into the current user's recipes. */
export async function cloneRecipe(formData: FormData): Promise<void> {
  const sourceId = String(formData.get("id") ?? "");
  if (!sourceId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: source } = await supabase
    .from("recipes")
    .select("*, recipe_ingredients(*)")
    .eq("id", sourceId)
    .single();
  if (!source) return;

  const { data: created, error } = await supabase
    .from("recipes")
    .insert({
      owner_id: user.id,
      title: source.title,
      description: source.description,
      instructions: source.instructions,
      servings: source.servings,
      difficulty: source.difficulty,
      prep_minutes: source.prep_minutes,
      cook_minutes: source.cook_minutes,
      calories: source.calories,
      protein_g: source.protein_g,
      carbs_g: source.carbs_g,
      fat_g: source.fat_g,
      fiber_g: source.fiber_g,
      image_url: source.image_url,
      tags: source.tags ?? [],
      origin: "cookbook",
      source_recipe_id: source.id,
      is_public: false,
    })
    .select("id")
    .single();
  if (error || !created) return;

  const ings = (source.recipe_ingredients ?? []) as {
    name: string;
    quantity: number | null;
    unit: string | null;
    position: number;
  }[];
  if (ings.length > 0) {
    await supabase.from("recipe_ingredients").insert(
      ings.map((ing) => ({
        recipe_id: created.id,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        position: ing.position,
      })),
    );
  }

  revalidatePath("/recipes");
  redirect("/recipes");
}

/** Add a private personal note on a recipe you own. */
export async function addPersonalRecipeComment(
  formData: FormData,
): Promise<void> {
  const recipeId = String(formData.get("recipe_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!recipeId || body.length < 1 || body.length > 2000) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: recipe } = await supabase
    .from("recipes")
    .select("id")
    .eq("id", recipeId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!recipe) return;

  await supabase.from("recipe_personal_comments").insert({
    recipe_id: recipeId,
    user_id: user.id,
    body,
  });

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);
}

/** Delete one of your personal notes. */
export async function deletePersonalRecipeComment(
  formData: FormData,
): Promise<void> {
  const commentId = String(formData.get("comment_id") ?? "").trim();
  const recipeId = String(formData.get("recipe_id") ?? "").trim();
  if (!commentId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("recipe_personal_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  revalidatePath("/recipes");
  if (recipeId) revalidatePath(`/recipes/${recipeId}`);
}
