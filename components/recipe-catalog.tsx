"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CopyPlus,
  Pencil,
  Trash2,
  Globe,
  Lock,
  Utensils,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/page-header";
import { RecipeTagBadges } from "@/components/recipe-tags";
import { RecipeOriginBadge } from "@/components/recipe-origin-badge";
import { RecipeNutrition } from "@/components/recipe-nutrition";
import { StarRatingDisplay } from "@/components/recipe-stars";
import { recipeTimingLine } from "@/lib/recipe-meta";
import { deleteRecipe, cloneRecipe } from "@/app/(app)/recipes/actions";
import type { Recipe, RecipeOrigin, RecipeRatingSummary } from "@/lib/types";

type RecipeCard = Recipe & {
  recipe_ingredients: { count: number }[];
  ratingSummary?: RecipeRatingSummary;
  personalCommentCount?: number;
};

type SortMode = "newest" | "title" | "tags" | "rating";
type OriginFilter = "all" | RecipeOrigin;

function collectTags(recipes: RecipeCard[]): string[] {
  const set = new Set<string>();
  for (const r of recipes) {
    for (const t of r.tags ?? []) set.add(t);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function recipeMatchesTags(recipe: RecipeCard, selected: string[]): boolean {
  if (selected.length === 0) return true;
  const tags = recipe.tags ?? [];
  return selected.every((t) => tags.includes(t));
}

export function RecipeCatalog({
  recipes,
  mode,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: {
  recipes: RecipeCard[];
  mode: "mine" | "cookbook";
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: React.ReactNode;
}) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sort, setSort] = useState<SortMode>("newest");
  const [originFilter, setOriginFilter] = useState<OriginFilter>("all");

  const availableTags = useMemo(() => collectTags(recipes), [recipes]);

  const visible = useMemo(() => {
    const filtered = recipes.filter((r) => {
      if (!recipeMatchesTags(r, selectedTags)) return false;
      if (mode === "mine" && originFilter !== "all") {
        const origin = r.origin ?? "user";
        if (origin !== originFilter) return false;
      }
      return true;
    });
    const sorted = [...filtered];
    if (sort === "title") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "tags") {
      sorted.sort((a, b) => {
        const at = (a.tags ?? []).slice().sort().join(",");
        const bt = (b.tags ?? []).slice().sort().join(",");
        if (at !== bt) return at.localeCompare(bt);
        return a.title.localeCompare(b.title);
      });
    } else if (sort === "rating") {
      sorted.sort((a, b) => {
        const ar = a.ratingSummary?.average ?? 0;
        const br = b.ratingSummary?.average ?? 0;
        if (br !== ar) return br - ar;
        const ac = a.ratingSummary?.count ?? 0;
        const bc = b.ratingSummary?.count ?? 0;
        if (bc !== ac) return bc - ac;
        return a.title.localeCompare(b.title);
      });
    } else {
      sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }
    return sorted;
  }, [recipes, selectedTags, sort, originFilter, mode]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  if (recipes.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        {mode === "mine" && (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Source
            </p>
            {(
              [
                ["all", "All"],
                ["user", "Your recipes"],
                ["cookbook", "From cookbook"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setOriginFilter(value)}
                className={
                  originFilter === value
                    ? "rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "rounded-full border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
                }
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Filter by tags
          </p>
          <div className="flex items-center gap-2">
            <label
              htmlFor="recipe-sort"
              className="text-xs text-zinc-500 dark:text-zinc-400"
            >
              Sort
            </label>
            <select
              id="recipe-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="newest">Newest</option>
              <option value="title">Title A–Z</option>
              <option value="tags">Tags A–Z</option>
              {mode === "cookbook" && (
                <option value="rating">Highest rated</option>
              )}
            </select>
          </div>
        </div>

        {availableTags.length === 0 ? (
          <p className="text-xs text-zinc-500">
            No tags on these recipes yet. Add tags when editing a recipe.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedTags([])}
              className={
                selectedTags.length === 0
                  ? "rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "rounded-full border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
              }
            >
              All
            </button>
            {availableTags.map((tag) => {
              const on = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={
                    on
                      ? "rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white"
                      : "rounded-full border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 hover:border-emerald-400 dark:border-zinc-700 dark:text-zinc-300"
                  }
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}

        {selectedTags.length > 0 && (
          <p className="text-xs text-zinc-500">
            Showing recipes tagged with{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {selectedTags.join(" + ")}
            </span>
            {" · "}
            {visible.length} result{visible.length === 1 ? "" : "s"}
            {" · "}
            <button
              type="button"
              onClick={() => setSelectedTags([])}
              className="text-emerald-600 hover:underline"
            >
              Clear
            </button>
          </p>
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="No recipes match these tags"
          description="Try clearing filters or selecting fewer tags."
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedTags([])}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((recipe) => {
            const count = recipe.recipe_ingredients?.[0]?.count ?? 0;
            return (
              <div
                key={recipe.id}
                className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                {mode === "mine" ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {recipe.title}
                      </h3>
                      <span
                        className="flex shrink-0 items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        title={recipe.is_public ? "Shared to cookbook" : "Private"}
                      >
                        {recipe.is_public ? (
                          <>
                            <Globe className="h-3 w-3" /> Shared
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3" /> Private
                          </>
                        )}
                      </span>
                    </div>
                    <RecipeOriginBadge origin={recipe.origin ?? "user"} />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Utensils className="h-4 w-4 shrink-0 text-emerald-600" />
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {recipe.title}
                      </h3>
                    </div>
                    <RecipeOriginBadge origin="cookbook" />
                  </div>
                )}

                {recipe.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {recipe.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-zinc-400">
                  {count} ingredient{count === 1 ? "" : "s"}
                  {recipe.servings ? ` · serves ${recipe.servings}` : ""}
                  {mode === "mine" &&
                  (recipe.personalCommentCount ?? 0) > 0
                    ? ` · ${recipe.personalCommentCount} note${
                        recipe.personalCommentCount === 1 ? "" : "s"
                      }`
                    : ""}
                </p>
                {recipeTimingLine(recipe) && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {recipeTimingLine(recipe)}
                  </p>
                )}
                <RecipeNutrition recipe={recipe} />
                {mode === "cookbook" && (
                  <div className="mt-2">
                    {recipe.ratingSummary && recipe.ratingSummary.count > 0 ? (
                      <StarRatingDisplay
                        value={recipe.ratingSummary.average}
                        count={recipe.ratingSummary.count}
                      />
                    ) : (
                      <p className="text-xs text-zinc-400">No ratings yet</p>
                    )}
                  </div>
                )}
                <RecipeTagBadges
                  tags={recipe.tags}
                  onTagClick={toggleTag}
                  activeTags={selectedTags}
                />

                {mode === "mine" ? (
                  <div className="mt-4 flex gap-2">
                    <Link href={`/recipes/${recipe.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Pencil className="h-4 w-4" /> Edit
                      </Button>
                    </Link>
                    <form action={deleteRecipe}>
                      <input type="hidden" name="id" value={recipe.id} />
                      <Button
                        variant="ghost"
                        size="icon"
                        type="submit"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col gap-2">
                    <Link href={`/cookbook/${recipe.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <MessageSquare className="h-4 w-4" />
                        View & review
                      </Button>
                    </Link>
                    <form action={cloneRecipe}>
                      <input type="hidden" name="id" value={recipe.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="w-full"
                      >
                        <CopyPlus className="h-4 w-4" /> Add to my recipes
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
