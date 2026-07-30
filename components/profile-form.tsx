"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/app/(app)/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DIET_TYPES } from "@/lib/diet";
import { FavoriteMealsSelect } from "@/components/favorite-meals-select";

type RecipeOption = { id: string; title: string };

const initial: ProfileState = {};

export function ProfileForm({
  displayName,
  dietType,
  allergies,
  servingMultiplier,
  favoriteIds,
  recipes,
}: {
  displayName: string;
  dietType: string;
  allergies: string;
  servingMultiplier: number;
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
