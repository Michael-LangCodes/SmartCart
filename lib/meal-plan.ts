import { createClient } from "@/lib/supabase/server";

/**
 * Return the meal plan id for a kitchen + week, creating the row if needed.
 * Returns null if the plan can't be created (e.g. not a member).
 */
export async function getOrCreateMealPlanId(
  kitchenId: string,
  week: string,
): Promise<string | null> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("kitchen_id", kitchenId)
    .eq("week_start", week)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("meal_plans")
    .insert({ kitchen_id: kitchenId, week_start: week })
    .select("id")
    .single();

  if (error) {
    // Possible race: another request created it first. Re-read.
    const { data: retry } = await supabase
      .from("meal_plans")
      .select("id")
      .eq("kitchen_id", kitchenId)
      .eq("week_start", week)
      .maybeSingle();
    return retry?.id ?? null;
  }

  return created?.id ?? null;
}
