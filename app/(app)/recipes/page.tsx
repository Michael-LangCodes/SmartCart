import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { RecipeCatalog } from "@/components/recipe-catalog";
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

  const ids = list.map((r) => r.id);
  const noteCountByRecipe = new Map<string, number>();
  if (ids.length > 0) {
    const { data: notes } = await supabase
      .from("recipe_personal_comments")
      .select("recipe_id")
      .eq("user_id", user!.id)
      .in("recipe_id", ids);
    for (const row of notes ?? []) {
      noteCountByRecipe.set(
        row.recipe_id,
        (noteCountByRecipe.get(row.recipe_id) ?? 0) + 1,
      );
    }
  }

  const withNotes = list.map((r) => ({
    ...r,
    personalCommentCount: noteCountByRecipe.get(r.id) ?? 0,
  }));

  return (
    <div>
      <PageHeader
        title="My Recipes"
        description="Your personal recipe collection. Open a recipe to edit it or add private notes."
        action={
          <Link href="/recipes/new">
            <Button>
              <Plus className="h-4 w-4" /> New recipe
            </Button>
          </Link>
        }
      />

      <RecipeCatalog
        recipes={withNotes}
        mode="mine"
        emptyTitle="No recipes yet"
        emptyDescription="Add your first recipe to start planning meals and generating grocery lists."
        emptyAction={
          <Link href="/recipes/new">
            <Button>
              <Plus className="h-4 w-4" /> New recipe
            </Button>
          </Link>
        }
      />
    </div>
  );
}
