import { CopyPlus, Utensils } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { cloneRecipe } from "../recipes/actions";
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
        description="Public recipes shared by other SmartCart users. Add any to your own collection."
      />

      {list.length === 0 ? (
        <EmptyState
          title="Nothing shared yet"
          description="When people mark their recipes as public, they'll show up here. Try sharing one of your own from My Recipes."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((recipe) => {
            const count = recipe.recipe_ingredients?.[0]?.count ?? 0;
            return (
              <div
                key={recipe.id}
                className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {recipe.title}
                  </h3>
                </div>
                {recipe.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {recipe.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-zinc-400">
                  {count} ingredient{count === 1 ? "" : "s"}
                  {recipe.servings ? ` · serves ${recipe.servings}` : ""}
                </p>
                <form action={cloneRecipe} className="mt-4">
                  <input type="hidden" name="id" value={recipe.id} />
                  <Button type="submit" variant="outline" size="sm" className="w-full">
                    <CopyPlus className="h-4 w-4" /> Add to my recipes
                  </Button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
