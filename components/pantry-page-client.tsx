"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, CookingPot, ExternalLink } from "lucide-react";
import {
  addPantryItem,
  clearPantry,
  deletePantryItem,
} from "@/app/(app)/pantry/actions";
import { cloneRecipe } from "@/app/(app)/recipes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RecipeImage } from "@/components/recipe-image";
import {
  matchRecipesToPantry,
  type PantryMatchRecipe,
} from "@/lib/pantry-match";
import type { KitchenPantryItem } from "@/lib/types";

type FilterMode = "any" | "half" | "ready";

export function PantryPageClient({
  items,
  recipes,
  currentUserId,
}: {
  items: KitchenPantryItem[];
  recipes: PantryMatchRecipe[];
  currentUserId: string;
}) {
  const [filter, setFilter] = useState<FilterMode>("any");

  const matches = useMemo(() => {
    const all = matchRecipesToPantry(
      recipes,
      items.map((i) => i.name),
    );
    if (filter === "ready") return all.filter((m) => m.ready);
    if (filter === "half") return all.filter((m) => m.score >= 0.5);
    return all.filter((m) => m.matchCount > 0);
  }, [recipes, items, filter]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,340px)_1fr]">
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            What&apos;s in the pantry
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Shared with your kitchen. Add ingredients you already have.
          </p>
        </div>

        <form
          action={addPantryItem}
          className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pantry-name">Ingredient</Label>
            <Input
              id="pantry-name"
              name="name"
              required
              placeholder="e.g. chicken, rice, garlic"
              autoComplete="off"
            />
          </div>
          <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pantry-qty">Qty</Label>
              <Input
                id="pantry-qty"
                name="quantity"
                type="number"
                min={0}
                step="any"
                placeholder="2"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pantry-unit">Unit</Label>
              <Input
                id="pantry-unit"
                name="unit"
                placeholder="lb"
                autoComplete="off"
              />
            </div>
            <Button type="submit" size="sm" className="mb-0.5">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </form>

        {items.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Pantry is empty. Add a few staples to see matching recipes.
          </p>
        ) : (
          <>
            <ul className="flex flex-col gap-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {item.name}
                    </p>
                    {(item.quantity != null || item.unit) && (
                      <p className="text-xs text-zinc-500">
                        {item.quantity != null ? item.quantity : ""}
                        {item.unit ? ` ${item.unit}` : ""}
                      </p>
                    )}
                  </div>
                  <form action={deletePantryItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
            <form action={clearPantry}>
              <Button type="submit" variant="ghost" size="sm">
                Clear pantry
              </Button>
            </form>
          </>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Recipe matches
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              From your recipes and the public cookbook.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["any", "Any match"],
                ["half", "≥ 50%"],
                ["ready", "Ready to cook"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={
                  filter === value
                    ? "rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "rounded-full border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            Add pantry items to find recipes you can make.
          </p>
        ) : matches.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            No recipes match this filter. Try adding more ingredients or
            loosening the filter.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {matches.map((m) => {
              const pct = Math.round(m.score * 100);
              const isOwn = m.recipe.owner_id === currentUserId;
              const href = isOwn
                ? `/recipes/${m.recipe.id}`
                : m.recipe.is_public
                  ? `/cookbook/${m.recipe.id}`
                  : `/recipes/${m.recipe.id}`;

              return (
                <li
                  key={m.recipe.id}
                  className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative w-full shrink-0 sm:w-40">
                      <RecipeImage
                        src={m.recipe.image_url}
                        alt={m.recipe.title}
                        variant="card"
                        className="rounded-none sm:h-full sm:min-h-[140px]"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <Link
                            href={href}
                            className="font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
                          >
                            {m.recipe.title}
                          </Link>
                          {m.ready ? (
                            <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                              <CookingPot className="h-3.5 w-3.5" />
                              Ready to cook
                            </p>
                          ) : (
                            <p className="mt-0.5 text-xs text-zinc-500">
                              {m.matchCount} of {m.total} ingredients on hand
                            </p>
                          )}
                        </div>
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium tabular-nums text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {pct}%
                        </span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className={
                            m.ready
                              ? "h-full rounded-full bg-emerald-600"
                              : "h-full rounded-full bg-sky-500"
                          }
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {m.recipe.description && (
                        <p className="line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                          {m.recipe.description}
                        </p>
                      )}

                      {m.missing.length > 0 && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          <span className="font-medium text-zinc-600 dark:text-zinc-300">
                            Still need:
                          </span>{" "}
                          {m.missing.slice(0, 8).join(", ")}
                          {m.missing.length > 8
                            ? ` +${m.missing.length - 8} more`
                            : ""}
                        </p>
                      )}
                      {m.matched.length > 0 && (
                        <p className="text-xs text-emerald-700/90 dark:text-emerald-300/90">
                          <span className="font-medium">Have:</span>{" "}
                          {m.matched.slice(0, 8).join(", ")}
                          {m.matched.length > 8
                            ? ` +${m.matched.length - 8} more`
                            : ""}
                        </p>
                      )}

                      <div className="mt-1 flex flex-wrap gap-2">
                        <Link href={href}>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4" />
                            {isOwn ? "Open recipe" : "View"}
                          </Button>
                        </Link>
                        {!isOwn && m.recipe.is_public && (
                          <form action={cloneRecipe}>
                            <input
                              type="hidden"
                              name="id"
                              value={m.recipe.id}
                            />
                            <Button type="submit" variant="ghost" size="sm">
                              Add to my recipes
                            </Button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
