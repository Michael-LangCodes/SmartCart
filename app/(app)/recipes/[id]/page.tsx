import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { RecipeForm } from "@/components/recipe-form";
import type { RecipeWithIngredients } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: recipe } = await supabase
    .from("recipes")
    .select("*, recipe_ingredients(*)")
    .eq("id", id)
    .eq("owner_id", user!.id)
    .maybeSingle();

  if (!recipe) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Edit recipe" description="Update your recipe." />
      <RecipeForm recipe={recipe as RecipeWithIngredients} />
    </div>
  );
}
