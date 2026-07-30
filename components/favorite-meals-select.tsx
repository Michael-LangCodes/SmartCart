"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";

type RecipeOption = { id: string; title: string };

/**
 * Three ranked favorite-meal selects. A recipe chosen in one slot is disabled
 * in the others so the same meal can't occupy multiple ranks.
 */
export function FavoriteMealsSelect({
  recipes,
  initialIds = ["", "", ""],
  label = "Top 3 favorite meals",
  compact = false,
}: {
  recipes: RecipeOption[];
  initialIds?: [string, string, string] | string[];
  label?: string;
  compact?: boolean;
}) {
  const [selected, setSelected] = useState<[string, string, string]>([
    initialIds[0] ?? "",
    initialIds[1] ?? "",
    initialIds[2] ?? "",
  ]);

  const update = (index: number, value: string) => {
    setSelected((prev) => {
      const next: [string, string, string] = [...prev];
      next[index] = value;
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <p className="text-xs text-zinc-500">
        Each meal can only be picked once across the three ranks.
      </p>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-1">
          {!compact && (
            <span className="text-xs font-medium text-zinc-500">#{i + 1}</span>
          )}
          <select
            name={`fav_${i + 1}`}
            value={selected[i]}
            onChange={(e) => update(i, e.target.value)}
            className={
              compact
                ? "h-9 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                : "h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            }
          >
            <option value="">
              {compact ? `#${i + 1} — None` : "— None —"}
            </option>
            {recipes.map((r) => {
              const takenElsewhere =
                selected.some((id, j) => j !== i && id === r.id);
              return (
                <option key={r.id} value={r.id} disabled={takenElsewhere}>
                  {r.title}
                  {takenElsewhere ? " (already selected)" : ""}
                </option>
              );
            })}
          </select>
        </div>
      ))}
    </div>
  );
}
