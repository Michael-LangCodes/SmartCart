"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateMealPlanId } from "@/lib/meal-plan";

export async function addMealEntry(formData: FormData): Promise<void> {
  const kitchenId = String(formData.get("kitchenId") ?? "");
  const week = String(formData.get("week") ?? "");
  const day = Number(formData.get("day"));
  const mealType = String(formData.get("mealType") ?? "");
  const recipeId = String(formData.get("recipeId") ?? "");

  if (!kitchenId || !week || !recipeId || Number.isNaN(day) || !mealType) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const mealPlanId = await getOrCreateMealPlanId(kitchenId, week);
  if (!mealPlanId) return;

  await supabase.from("meal_plan_entries").insert({
    meal_plan_id: mealPlanId,
    day_of_week: day,
    meal_type: mealType,
    recipe_id: recipeId,
  });

  revalidatePath("/planner");
  revalidatePath("/grocery");
}

export async function removeMealEntry(formData: FormData): Promise<void> {
  const entryId = String(formData.get("entryId") ?? "");
  if (!entryId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("meal_plan_entries").delete().eq("id", entryId);

  revalidatePath("/planner");
  revalidatePath("/grocery");
}
