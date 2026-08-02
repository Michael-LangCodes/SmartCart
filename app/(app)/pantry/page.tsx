import Link from "next/link";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getActiveKitchen } from "@/lib/kitchen";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PantryPageClient } from "@/components/pantry-page-client";
import type { PantryMatchRecipe } from "@/lib/pantry-match";
import type { KitchenPantryItem, RecipeIngredient } from "@/lib/types";

export const dynamic = "force-dynamic";

type RecipeRow = {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  owner_id: string;
  image_url: string | null;
  source_recipe_id: string | null;
  recipe_ingredients: Pick<RecipeIngredient, "name">[] | null;
};

export default async function PantryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const activeKitchen = await getActiveKitchen();

  if (!activeKitchen) {
    return (
      <div>
        <PageHeader title="Pantry" />
        <EmptyState
          title="Create a kitchen first"
          description="Pantry items are shared with your kitchen so everyone can plan around what you already have."
          action={
            <Link href="/kitchens">
              <Button>
                <Users className="h-4 w-4" /> Go to Kitchens
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const [
    { data: pantryRows },
    { data: recipeRows },
    { data: profileFavs },
    { data: kitchenPeople },
  ] = await Promise.all([
    supabase
      .from("kitchen_pantry_items")
      .select("*")
      .eq("kitchen_id", activeKitchen.id)
      .order("name"),
    supabase
      .from("recipes")
      .select(
        "id, title, description, is_public, owner_id, image_url, source_recipe_id, recipe_ingredients(name)",
      )
      .or(`owner_id.eq.${user!.id},is_public.eq.true`)
      .order("title"),
    supabase
      .from("profile_favorite_recipes")
      .select("recipe_id, position")
      .eq("profile_id", user!.id),
    supabase
      .from("kitchen_people")
      .select("id")
      .eq("kitchen_id", activeKitchen.id),
  ]);

  const personIds = (kitchenPeople ?? []).map((p) => p.id);
  let personFavs: { recipe_id: string; position: number }[] = [];
  if (personIds.length > 0) {
    const { data } = await supabase
      .from("kitchen_person_favorites")
      .select("recipe_id, position")
      .in("person_id", personIds);
    personFavs = data ?? [];
  }

  /** Best (lowest) favorite rank per recipe id, including clones ↔ source. */
  const favoriteById = new Map<string, number>();
  const remember = (recipeId: string, position: number) => {
    const prev = favoriteById.get(recipeId);
    if (prev === undefined || position < prev) {
      favoriteById.set(recipeId, position);
    }
  };

  for (const f of profileFavs ?? []) {
    remember(f.recipe_id, f.position);
  }
  // Household favorites rank after profile (offset so profile 1–3 stay first).
  for (const f of personFavs) {
    remember(f.recipe_id, f.position + 3);
  }

  const items = (pantryRows ?? []) as KitchenPantryItem[];
  const recipes: PantryMatchRecipe[] = ((recipeRows ?? []) as RecipeRow[]).map(
    (r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      is_public: r.is_public,
      owner_id: r.owner_id,
      image_url: r.image_url,
      ingredients: (r.recipe_ingredients ?? []).map((i) => ({ name: i.name })),
    }),
  );

  // If a favorite is a clone, also mark its cookbook source (and vice versa).
  const rows = (recipeRows ?? []) as RecipeRow[];
  for (const r of rows) {
    const rank = favoriteById.get(r.id);
    if (rank != null && r.source_recipe_id) {
      remember(r.source_recipe_id, rank);
    }
  }
  for (const r of rows) {
    if (!r.source_recipe_id) continue;
    const sourceRank = favoriteById.get(r.source_recipe_id);
    if (sourceRank != null) remember(r.id, sourceRank);
  }

  return (
    <div>
      <PageHeader
        title="Pantry"
        description={`Track what ${activeKitchen.name} already has, then find recipes that use it — closest matches first, favorites highlighted.`}
      />
      <PantryPageClient
        items={items}
        recipes={recipes}
        currentUserId={user!.id}
        favoriteById={Object.fromEntries(favoriteById)}
      />
    </div>
  );
}
