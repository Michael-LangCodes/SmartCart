import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CopyPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { RecipeOriginBadge } from "@/components/recipe-origin-badge";
import { RecipeNutrition } from "@/components/recipe-nutrition";
import { RecipeImage } from "@/components/recipe-image";
import { RecipeTagBadges } from "@/components/recipe-tags";
import { CookbookReviews } from "@/components/cookbook-reviews";
import { cloneRecipe } from "@/app/(app)/recipes/actions";
import { recipeTimingLine } from "@/lib/recipe-meta";
import type {
  RecipeCommentWithAuthor,
  RecipeRatingSummary,
  RecipeWithIngredients,
} from "@/lib/types";

export const dynamic = "force-dynamic";

function summarizeRatings(
  rows: { rating: number }[] | null | undefined,
): RecipeRatingSummary {
  const list = rows ?? [];
  if (list.length === 0) return { average: 0, count: 0 };
  const sum = list.reduce((a, r) => a + Number(r.rating), 0);
  return {
    average: Math.round((sum / list.length) * 10) / 10,
    count: list.length,
  };
}

export default async function CookbookRecipePage({
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
    .eq("is_public", true)
    .maybeSingle();

  if (!recipe) notFound();

  const typed = recipe as RecipeWithIngredients;
  const ingredients = [...(typed.recipe_ingredients ?? [])].sort(
    (a, b) => a.position - b.position,
  );

  const [{ data: ratingRows }, { data: myRatingRow }, { data: commentRows }] =
    await Promise.all([
      supabase.from("recipe_ratings").select("rating").eq("recipe_id", id),
      user
        ? supabase
            .from("recipe_ratings")
            .select("rating")
            .eq("recipe_id", id)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("recipe_comments")
        .select("id, recipe_id, user_id, body, created_at")
        .eq("recipe_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const summary = summarizeRatings(ratingRows);
  const myRating = myRatingRow?.rating ?? null;

  const authorIds = Array.from(
    new Set((commentRows ?? []).map((c) => c.user_id)),
  );
  const nameById = new Map<string, string>();
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", authorIds);
    for (const p of profiles ?? []) {
      nameById.set(p.id, p.display_name?.trim() || "Cook");
    }
  }

  const comments: RecipeCommentWithAuthor[] = (commentRows ?? []).map((c) => ({
    ...c,
    author_name: nameById.get(c.user_id) ?? "Cook",
  }));

  const canReview = Boolean(user && !user.is_anonymous);
  const timing = recipeTimingLine(typed);
  const isOwn = user?.id === typed.owner_id;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/cookbook"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" /> Back to cookbook
      </Link>

      <RecipeImage
        src={typed.image_url}
        alt={typed.title}
        variant="hero"
        className="mb-6 rounded-xl"
      />

      <PageHeader
        title={typed.title}
        description={typed.description ?? undefined}
        action={
          isOwn ? (
            <Link href={`/recipes/${typed.id}`}>
              <Button variant="outline" size="sm">
                Edit my recipe
              </Button>
            </Link>
          ) : (
            <form action={cloneRecipe}>
              <input type="hidden" name="id" value={typed.id} />
              <Button type="submit" size="sm">
                <CopyPlus className="h-4 w-4" /> Add to my recipes
              </Button>
            </form>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <RecipeOriginBadge origin="cookbook" />
        {timing && (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {timing}
          </span>
        )}
        {typed.servings ? (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Serves {typed.servings}
          </span>
        ) : null}
      </div>

      <RecipeNutrition recipe={typed} />
      <div className="mt-2">
        <RecipeTagBadges tags={typed.tags ?? []} />
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Ingredients
        </h2>
        {ingredients.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No ingredients listed.</p>
        ) : (
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-800 dark:text-zinc-200">
            {ingredients.map((ing) => (
              <li key={ing.id}>
                {ing.quantity != null ? `${ing.quantity} ` : ""}
                {ing.unit ? `${ing.unit} ` : ""}
                {ing.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      {typed.instructions && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Instructions
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
            {typed.instructions}
          </p>
        </section>
      )}

      <CookbookReviews
        recipeId={typed.id}
        summary={summary}
        myRating={myRating}
        comments={comments}
        canReview={canReview}
        currentUserId={user?.id ?? ""}
      />
    </div>
  );
}
