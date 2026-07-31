import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { RecipeCatalog } from "@/components/recipe-catalog";
import type { Recipe, RecipeRatingSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

function buildRatingSummaries(
  rows: { recipe_id: string; rating: number }[] | null,
): Map<string, RecipeRatingSummary> {
  const map = new Map<string, { sum: number; count: number }>();
  for (const row of rows ?? []) {
    const cur = map.get(row.recipe_id) ?? { sum: 0, count: 0 };
    cur.sum += Number(row.rating);
    cur.count += 1;
    map.set(row.recipe_id, cur);
  }
  const out = new Map<string, RecipeRatingSummary>();
  for (const [id, { sum, count }] of map) {
    out.set(id, {
      average: Math.round((sum / count) * 10) / 10,
      count,
    });
  }
  return out;
}

export default async function CookbookPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: recipes } = await supabase
    .from("recipes")
    .select("*, recipe_ingredients(count)")
    .eq("is_public", true)
    .neq("owner_id", user!.id)
    .order("created_at", { ascending: false });

  const list = (recipes ?? []) as (Recipe & {
    recipe_ingredients: { count: number }[];
  })[];

  const ids = list.map((r) => r.id);
  let ratingsByRecipe = new Map<string, RecipeRatingSummary>();
  if (ids.length > 0) {
    const { data: ratingRows } = await supabase
      .from("recipe_ratings")
      .select("recipe_id, rating")
      .in("recipe_id", ids);
    ratingsByRecipe = buildRatingSummaries(ratingRows);
  }

  const withRatings = list.map((r) => ({
    ...r,
    ratingSummary: ratingsByRecipe.get(r.id) ?? { average: 0, count: 0 },
  }));

  return (
    <div>
      <PageHeader
        title="Cookbook"
        description="Public recipes shared by other SmartCart users. Open a recipe to rate it, leave a comment, or add it to your collection."
      />

      <RecipeCatalog
        recipes={withRatings}
        mode="cookbook"
        emptyTitle="Nothing shared yet"
        emptyDescription="When people mark their recipes as public, they'll show up here. Try sharing one of your own from My Recipes."
      />
    </div>
  );
}
