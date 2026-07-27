"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateMealPlanId } from "@/lib/meal-plan";

type Agg = {
  name: string;
  unit: string | null;
  quantity: number;
  allNull: boolean;
};

function slotKey(name: string, unit: string | null) {
  return `${name.trim().toLowerCase()}__${(unit ?? "").trim().toLowerCase()}`;
}

/**
 * Regenerate the grocery list for a kitchen's week by aggregating the
 * ingredients of every planned recipe. Checked state is preserved by
 * (name, unit).
 */
export async function generateGroceryList(formData: FormData): Promise<void> {
  const kitchenId = String(formData.get("kitchenId") ?? "");
  const week = String(formData.get("week") ?? "");
  if (!kitchenId || !week) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const mealPlanId = await getOrCreateMealPlanId(kitchenId, week);
  if (!mealPlanId) return;

  // Which recipes are planned, and how many times each.
  const { data: entries } = await supabase
    .from("meal_plan_entries")
    .select("recipe_id")
    .eq("meal_plan_id", mealPlanId);

  const occurrences = new Map<string, number>();
  for (const e of entries ?? []) {
    occurrences.set(e.recipe_id, (occurrences.get(e.recipe_id) ?? 0) + 1);
  }
  const recipeIds = Array.from(occurrences.keys());

  // Preserve currently-checked items.
  const { data: existing } = await supabase
    .from("grocery_items")
    .select("name, unit, checked")
    .eq("meal_plan_id", mealPlanId);
  const checkedByKey = new Map<string, boolean>();
  for (const item of existing ?? []) {
    if (item.checked) checkedByKey.set(slotKey(item.name, item.unit), true);
  }

  // Aggregate ingredients.
  const agg = new Map<string, Agg>();
  if (recipeIds.length > 0) {
    const { data: ingredients } = await supabase
      .from("recipe_ingredients")
      .select("recipe_id, name, quantity, unit")
      .in("recipe_id", recipeIds);

    for (const ing of ingredients ?? []) {
      const times = occurrences.get(ing.recipe_id) ?? 1;
      const key = slotKey(ing.name, ing.unit);
      const cur =
        agg.get(key) ??
        ({
          name: ing.name.trim(),
          unit: ing.unit?.trim() || null,
          quantity: 0,
          allNull: true,
        } satisfies Agg);
      if (ing.quantity !== null && ing.quantity !== undefined) {
        cur.quantity += Number(ing.quantity) * times;
        cur.allNull = false;
      }
      agg.set(key, cur);
    }
  }

  // Replace the list.
  await supabase.from("grocery_items").delete().eq("meal_plan_id", mealPlanId);

  const rows = Array.from(agg.entries()).map(([key, v]) => ({
    meal_plan_id: mealPlanId,
    name: v.name,
    quantity: v.allNull ? null : v.quantity,
    unit: v.unit,
    checked: checkedByKey.get(key) ?? false,
  }));

  if (rows.length > 0) {
    await supabase.from("grocery_items").insert(rows);
  }

  revalidatePath("/grocery");
}

export async function toggleGroceryItem(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const checked = formData.get("checked") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("grocery_items").update({ checked }).eq("id", id);
  revalidatePath("/grocery");
}

export async function addGroceryItem(formData: FormData): Promise<void> {
  const kitchenId = String(formData.get("kitchenId") ?? "");
  const week = String(formData.get("week") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const qtyRaw = String(formData.get("quantity") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim() || null;
  if (!kitchenId || !week || !name) return;

  const supabase = await createClient();
  const mealPlanId = await getOrCreateMealPlanId(kitchenId, week);
  if (!mealPlanId) return;

  const quantity = qtyRaw === "" ? null : Number(qtyRaw);
  await supabase.from("grocery_items").insert({
    meal_plan_id: mealPlanId,
    name,
    quantity: quantity !== null && Number.isFinite(quantity) ? quantity : null,
    unit,
    checked: false,
  });
  revalidatePath("/grocery");
}

export async function deleteGroceryItem(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("grocery_items").delete().eq("id", id);
  revalidatePath("/grocery");
}
