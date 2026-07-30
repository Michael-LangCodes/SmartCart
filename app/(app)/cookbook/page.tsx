import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { RecipeCatalog } from "@/components/recipe-catalog";
import type { Recipe } from "@/lib/types";

export const dynamic = "force-dynamic";

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

  return (
    <div>
      <PageHeader
        title="Cookbook"
        description="Public recipes shared by other SmartCart users. Filter by tags or add any to your collection."
      />

      <RecipeCatalog
        recipes={list}
        mode="cookbook"
        emptyTitle="Nothing shared yet"
        emptyDescription="When people mark their recipes as public, they'll show up here. Try sharing one of your own from My Recipes."
      />
    </div>
  );
}
