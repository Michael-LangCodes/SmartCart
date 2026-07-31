import { recipeNutritionLine } from "@/lib/recipe-meta";

/** Compact estimated nutrition display for recipe cards. */
export function RecipeNutrition({
  recipe,
}: {
  recipe: {
    calories?: number | null;
    protein_g?: number | null;
    carbs_g?: number | null;
    fat_g?: number | null;
    fiber_g?: number | null;
  };
}) {
  const line = recipeNutritionLine(recipe);
  if (!line) return null;
  return (
    <p
      className="mt-1 text-xs text-zinc-500 dark:text-zinc-400"
      title="Estimated nutrition per serving"
    >
      <span className="font-medium text-zinc-600 dark:text-zinc-300">
        Est. / serving:
      </span>{" "}
      {line}
    </p>
  );
}
