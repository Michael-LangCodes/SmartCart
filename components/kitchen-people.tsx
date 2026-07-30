"use client";

import { useActionState, useState } from "react";
import { Plus, Pencil, Trash2, UserRound } from "lucide-react";
import {
  addKitchenPerson,
  updateKitchenPerson,
  deleteKitchenPerson,
  type PersonState,
} from "@/app/(app)/kitchens/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DIET_TYPES, dietLabel, formatAllergies } from "@/lib/diet";
import type { KitchenPerson } from "@/lib/types";

type RecipeOption = { id: string; title: string };
type PersonRow = KitchenPerson & {
  favorites: { position: number; recipe_id: string; title: string }[];
};

const initial: PersonState = {};

function PersonFields({
  person,
  recipes,
}: {
  person?: PersonRow;
  recipes: RecipeOption[];
}) {
  const favByPos = new Map(
    (person?.favorites ?? []).map((f) => [f.position, f.recipe_id]),
  );

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`name-${person?.id ?? "new"}`}>Name</Label>
        <Input
          id={`name-${person?.id ?? "new"}`}
          name="name"
          required
          defaultValue={person?.name}
          placeholder="e.g. Alex (no account)"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Eating type</Label>
          <select
            name="diet_type"
            defaultValue={person?.diet_type ?? "all"}
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
          <Label>Serving multiplier</Label>
          <Input
            name="serving_multiplier"
            type="number"
            step="0.25"
            min="0.25"
            max="10"
            defaultValue={person?.serving_multiplier ?? 1}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Allergies</Label>
        <Input
          name="allergies"
          defaultValue={formatAllergies(person?.allergies)}
          placeholder="peanuts, dairy"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Notes (optional)</Label>
        <Textarea
          name="notes"
          rows={2}
          defaultValue={person?.notes ?? ""}
          placeholder="Prefers mild spice, etc."
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Top 3 favorite meals</Label>
        {[1, 2, 3].map((pos) => (
          <select
            key={pos}
            name={`fav_${pos}`}
            defaultValue={favByPos.get(pos) ?? ""}
            className="h-9 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">#{pos} — None</option>
            {recipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        ))}
      </div>
    </>
  );
}

export function AddKitchenPersonForm({
  kitchenId,
  recipes,
}: {
  kitchenId: string;
  recipes: RecipeOption[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    async (prev: PersonState, fd: FormData) => {
      const result = await addKitchenPerson(prev, fd);
      if (!result.error) setOpen(false);
      return result;
    },
    initial,
  );

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Add household person
      </Button>
    );
  }

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-700"
    >
      <input type="hidden" name="kitchenId" value={kitchenId} />
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        New household person (no account)
      </p>
      <PersonFields recipes={recipes} />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Adding..." : "Add"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function KitchenPeopleList({
  people,
  recipes,
}: {
  people: PersonRow[];
  recipes: RecipeOption[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (people.length === 0 && editingId === null) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No household people yet. Add kids, guests, or anyone without an account.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {people.map((person) =>
        editingId === person.id ? (
          <EditPersonRow
            key={person.id}
            person={person}
            recipes={recipes}
            onDone={() => setEditingId(null)}
          />
        ) : (
          <li
            key={person.id}
            className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
                  <UserRound className="h-4 w-4 text-emerald-600" />
                  {person.name}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {dietLabel(person.diet_type)} · ×{person.serving_multiplier} servings
                  {person.allergies?.length
                    ? ` · allergies: ${formatAllergies(person.allergies)}`
                    : ""}
                </p>
                {person.favorites.length > 0 && (
                  <p className="mt-1 text-xs text-zinc-500">
                    Favorites:{" "}
                    {person.favorites
                      .sort((a, b) => a.position - b.position)
                      .map((f) => f.title)
                      .join(", ")}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingId(person.id)}
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <form action={deleteKitchenPerson}>
                  <input type="hidden" name="personId" value={person.id} />
                  <Button type="submit" variant="ghost" size="icon" title="Remove">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </form>
              </div>
            </div>
          </li>
        ),
      )}
    </ul>
  );
}

function EditPersonRow({
  person,
  recipes,
  onDone,
}: {
  person: PersonRow;
  recipes: RecipeOption[];
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(
    async (prev: PersonState, fd: FormData) => {
      const result = await updateKitchenPerson(prev, fd);
      if (!result.error) onDone();
      return result;
    },
    initial,
  );

  return (
    <li className="rounded-lg border border-emerald-200 bg-white p-3 dark:border-emerald-900 dark:bg-zinc-900">
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="personId" value={person.id} />
        <PersonFields person={person} recipes={recipes} />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving..." : "Save"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>
    </li>
  );
}
