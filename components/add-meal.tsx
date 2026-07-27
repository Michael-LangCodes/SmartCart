"use client";

import { Plus } from "lucide-react";
import { addMealEntry } from "@/app/(app)/planner/actions";

type RecipeOption = { id: string; title: string };

export function AddMeal({
  kitchenId,
  week,
  day,
  mealType,
  recipes,
}: {
  kitchenId: string;
  week: string;
  day: number;
  mealType: string;
  recipes: RecipeOption[];
}) {
  return (
    <form action={addMealEntry} className="mt-1">
      <input type="hidden" name="kitchenId" value={kitchenId} />
      <input type="hidden" name="week" value={week} />
      <input type="hidden" name="day" value={day} />
      <input type="hidden" name="mealType" value={mealType} />
      <label className="group flex cursor-pointer items-center gap-1 rounded-md border border-dashed border-zinc-300 px-2 py-1 text-xs text-zinc-400 hover:border-emerald-400 hover:text-emerald-600 dark:border-zinc-700">
        <Plus className="h-3 w-3" />
        <span className="sr-only">Add meal</span>
        <select
          name="recipeId"
          defaultValue=""
          onChange={(e) => {
            if (e.currentTarget.value) e.currentTarget.form?.requestSubmit();
          }}
          className="w-full cursor-pointer bg-transparent text-xs text-zinc-500 focus:outline-none dark:text-zinc-400"
        >
          <option value="" disabled>
            Add recipe
          </option>
          {recipes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
