import Link from "next/link";
import { Plus, Pencil, Trash2, Globe, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { deleteRecipe } from "./actions";
import { recipeTimingLine } from "@/lib/recipe-meta";
import { RecipeTagBadges } from "@/components/recipe-tags";
import type { Recipe } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: recipes } = await supabase
    .from("recipes")
    .select("*, recipe_ingredients(count)")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false });

  const list = (recipes ?? []) as (Recipe & {
    recipe_ingredients: { count: number }[];
  })[];

  return (
    <div>
      <PageHeader
        title="My Recipes"
        description="Your personal recipe collection."
        action={
          <Link href="/recipes/new">
            <Button>
              <Plus className="h-4 w-4" /> New recipe
            </Button>
          </Link>
        }
      />

      {list.length === 0 ? (
        <EmptyState
          title="No recipes yet"
          description="Add your first recipe to start planning meals and generating grocery lists."
          action={
            <Link href="/recipes/new">
              <Button>
                <Plus className="h-4 w-4" /> New recipe
              </Button>
            </Link>
          }
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
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {recipe.title}
                  </h3>
                  <span
                    className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    title={recipe.is_public ? "Public" : "Private"}
                  >
                    {recipe.is_public ? (
                      <>
                        <Globe className="h-3 w-3" /> Public
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3" /> Private
                      </>
                    )}
                  </span>
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
                {recipeTimingLine(recipe) && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {recipeTimingLine(recipe)}
                  </p>
                )}
                <RecipeTagBadges tags={recipe.tags} />

                <div className="mt-4 flex gap-2">
                  <Link href={`/recipes/${recipe.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                  </Link>
                  <form action={deleteRecipe}>
                    <input type="hidden" name="id" value={recipe.id} />
                    <Button variant="ghost" size="icon" type="submit" title="Delete">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
