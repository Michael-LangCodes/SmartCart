import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { RecipeForm } from "@/components/recipe-form";
import { PersonalRecipeComments } from "@/components/personal-recipe-comments";
import type { RecipePersonalComment, RecipeWithIngredients } from "@/lib/types";

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

  const { data: commentRows } = await supabase
    .from("recipe_personal_comments")
    .select("id, recipe_id, user_id, body, created_at")
    .eq("recipe_id", id)
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const comments = (commentRows ?? []) as RecipePersonalComment[];

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Edit recipe" description="Update your recipe." />
      <RecipeForm recipe={recipe as RecipeWithIngredients} />
      <PersonalRecipeComments recipeId={id} comments={comments} />
    </div>
  );
}
