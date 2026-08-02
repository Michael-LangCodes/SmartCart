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

  const [{ data: pantryRows }, { data: recipeRows }] = await Promise.all([
    supabase
      .from("kitchen_pantry_items")
      .select("*")
      .eq("kitchen_id", activeKitchen.id)
      .order("name"),
    supabase
      .from("recipes")
      .select(
        "id, title, description, is_public, owner_id, image_url, recipe_ingredients(name)",
      )
      .or(`owner_id.eq.${user!.id},is_public.eq.true`)
      .order("title"),
  ]);

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

  return (
    <div>
      <PageHeader
        title="Pantry"
        description={`Track what ${activeKitchen.name} already has, then find recipes that use it.`}
      />
      <PantryPageClient
        items={items}
        recipes={recipes}
        currentUserId={user!.id}
      />
    </div>
  );
}
