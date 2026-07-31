"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/app/(app)/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DIET_TYPES, type MacroTargets } from "@/lib/diet";
import { FavoriteMealsSelect } from "@/components/favorite-meals-select";

type RecipeOption = { id: string; title: string };

const initial: ProfileState = {};

function targetDefault(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return "";
  return String(n);
}

export function ProfileForm({
  displayName,
  dietType,
  allergies,
  servingMultiplier,
  macroTargets,
  favoriteIds,
  recipes,
}: {
  displayName: string;
  dietType: string;
  allergies: string;
  servingMultiplier: number;
  macroTargets: MacroTargets;
  favoriteIds: [string, string, string];
  recipes: RecipeOption[];
}) {
  const [state, action, pending] = useActionState(updateProfile, initial);

  return (
    <form action={action} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="display_name">Display name</Label>
        <Input
          id="display_name"
          name="display_name"
          defaultValue={displayName}
          placeholder="Jamie Cook"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="diet_type">Eating type</Label>
        <select
          id="diet_type"
          name="diet_type"
          defaultValue={dietType}
          className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {DIET_TYPES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="allergies">Allergies</Label>
        <Textarea
          id="allergies"
          name="allergies"
          rows={2}
          defaultValue={allergies}
          placeholder="e.g. peanuts, shellfish, dairy"
        />
        <p className="text-xs text-zinc-500">Separate with commas.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="serving_multiplier">Serving size multiplier</Label>
        <Input
          id="serving_multiplier"
          name="serving_multiplier"
          type="number"
          step="0.25"
          min="0.25"
          max="10"
          defaultValue={servingMultiplier}
        />
        <p className="text-xs text-zinc-500">
          Use less than 1 for smaller portions (e.g. 0.5), greater than 1 for
          larger (e.g. 1.5).
        </p>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Daily nutrition targets
        </legend>
        <p className="text-xs text-zinc-500">
          Optional goals used in the weekly planner summary. Leave blank to skip.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="target_calories">Calories (kcal)</Label>
            <Input
              id="target_calories"
              name="target_calories"
              type="number"
              min={0}
              step={1}
              defaultValue={targetDefault(macroTargets.target_calories)}
              placeholder="2000"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="target_protein_g">Protein (g)</Label>
            <Input
              id="target_protein_g"
              name="target_protein_g"
              type="number"
              min={0}
              step={1}
              defaultValue={targetDefault(macroTargets.target_protein_g)}
              placeholder="120"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="target_carbs_g">Carbs (g)</Label>
            <Input
              id="target_carbs_g"
              name="target_carbs_g"
              type="number"
              min={0}
              step={1}
              defaultValue={targetDefault(macroTargets.target_carbs_g)}
              placeholder="200"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="target_fat_g">Fat (g)</Label>
            <Input
              id="target_fat_g"
              name="target_fat_g"
              type="number"
              min={0}
              step={1}
              defaultValue={targetDefault(macroTargets.target_fat_g)}
              placeholder="65"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2 sm:max-w-[calc(50%-0.375rem)]">
            <Label htmlFor="target_fiber_g">Fiber (g)</Label>
            <Input
              id="target_fiber_g"
              name="target_fiber_g"
              type="number"
              min={0}
              step={1}
              defaultValue={targetDefault(macroTargets.target_fiber_g)}
              placeholder="30"
            />
          </div>
        </div>
      </fieldset>

      <FavoriteMealsSelect recipes={recipes} initialIds={favoriteIds} />

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
