"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { saveRecipe } from "@/app/(app)/recipes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DIFFICULTY_OPTIONS } from "@/lib/recipe-meta";
import { RecipeTagsField } from "@/components/recipe-tags";
import type { RecipeWithIngredients } from "@/lib/types";

type Row = { key: number; name: string; quantity: string; unit: string };

let keySeq = 0;
const newRow = (): Row => ({
  key: keySeq++,
  name: "",
  quantity: "",
  unit: "",
});

export function RecipeForm({ recipe }: { recipe?: RecipeWithIngredients }) {
  const initialRows: Row[] =
    recipe && recipe.recipe_ingredients.length > 0
      ? recipe.recipe_ingredients
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((i) => ({
            key: keySeq++,
            name: i.name,
            quantity: i.quantity?.toString() ?? "",
            unit: i.unit ?? "",
          }))
      : [newRow(), newRow()];

  const [rows, setRows] = useState<Row[]>(initialRows);

  const update = (key: number, field: keyof Row, value: string) =>
    setRows((rs) =>
      rs.map((r) => (r.key === key ? { ...r, [field]: value } : r)),
    );

  return (
    <form action={saveRecipe} className="flex flex-col gap-6">
      {recipe && <input type="hidden" name="id" value={recipe.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            required
            defaultValue={recipe?.title}
            placeholder="Weeknight pasta"
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="description">Short description</Label>
          <Input
            id="description"
            name="description"
            defaultValue={recipe?.description ?? ""}
            placeholder="Quick and comforting"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="servings">Servings</Label>
          <Input
            id="servings"
            name="servings"
            type="number"
            min={1}
            defaultValue={recipe?.servings ?? ""}
            placeholder="4"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="difficulty">Difficulty</Label>
          <select
            id="difficulty"
            name="difficulty"
            defaultValue={recipe?.difficulty ?? ""}
            className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">— Not set —</option>
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="prep_minutes">Prep time (minutes)</Label>
          <Input
            id="prep_minutes"
            name="prep_minutes"
            type="number"
            min={0}
            step={1}
            defaultValue={recipe?.prep_minutes ?? ""}
            placeholder="15"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cook_minutes">Cook time (minutes)</Label>
          <Input
            id="cook_minutes"
            name="cook_minutes"
            type="number"
            min={0}
            step={1}
            defaultValue={recipe?.cook_minutes ?? ""}
            placeholder="30"
          />
        </div>
        <div className="flex items-end sm:col-span-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              name="is_public"
              defaultChecked={recipe?.is_public ?? false}
              className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            />
            Share to cookbook
          </label>
        </div>

        <RecipeTagsField initialTags={recipe?.tags ?? []} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label>Ingredients</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRows((rs) => [...rs, newRow()])}
          >
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="hidden grid-cols-[1fr_90px_110px_40px] gap-2 px-1 text-xs font-medium text-zinc-500 sm:grid dark:text-zinc-400">
            <span>Ingredient</span>
            <span>Qty</span>
            <span>Unit</span>
            <span />
          </div>
          {rows.map((row) => (
            <div
              key={row.key}
              className="grid grid-cols-[1fr_70px_40px] items-center gap-2 sm:grid-cols-[1fr_90px_110px_40px]"
            >
              <Input
                name="ing_name"
                value={row.name}
                onChange={(e) => update(row.key, "name", e.target.value)}
                placeholder="e.g. Spaghetti"
              />
              <Input
                name="ing_qty"
                value={row.quantity}
                onChange={(e) => update(row.key, "quantity", e.target.value)}
                placeholder="1"
                inputMode="decimal"
              />
              <Input
                name="ing_unit"
                value={row.unit}
                onChange={(e) => update(row.key, "unit", e.target.value)}
                placeholder="lb"
                className="hidden sm:block"
              />
              <button
                type="button"
                onClick={() =>
                  setRows((rs) =>
                    rs.length > 1 ? rs.filter((r) => r.key !== row.key) : rs,
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                title="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea
          id="instructions"
          name="instructions"
          rows={6}
          defaultValue={recipe?.instructions ?? ""}
          placeholder="Step-by-step method..."
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit">
          {recipe ? "Save changes" : "Create recipe"}
        </Button>
        <Link href="/recipes">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
