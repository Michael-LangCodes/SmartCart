"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDifficulty } from "@/lib/recipe-meta";

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
  const isPublic = formData.get("is_public") === "on";
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
