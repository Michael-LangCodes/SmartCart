"use client";

import { Trash2 } from "lucide-react";
import {
  addPersonalRecipeComment,
  deletePersonalRecipeComment,
} from "@/app/(app)/recipes/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { RecipePersonalComment } from "@/lib/types";

/** Private notes on a recipe you own — not shared to the cookbook. */
export function PersonalRecipeComments({
  recipeId,
  comments,
}: {
  recipeId: string;
  comments: RecipePersonalComment[];
}) {
  return (
    <section className="mt-10 border-t border-zinc-200 pt-8 dark:border-zinc-800">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Personal notes{" "}
        <span className="font-normal text-zinc-400">({comments.length})</span>
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Private reminders for yourself — only you can see these.
      </p>

      <form
        action={addPersonalRecipeComment}
        className="mt-4 flex flex-col gap-2"
      >
        <input type="hidden" name="recipe_id" value={recipeId} />
        <Label htmlFor="personal-comment-body" className="sr-only">
          Personal note
        </Label>
        <Textarea
          id="personal-comment-body"
          name="body"
          rows={3}
          maxLength={2000}
          required
          placeholder="e.g. Kids liked less salt · double garlic next time · freeze leftovers well…"
        />
        <div>
          <Button type="submit" size="sm">
            Add note
          </Button>
        </div>
      </form>

      {comments.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          No personal notes yet.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950/40"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-zinc-400">
                  {new Date(c.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <form action={deletePersonalRecipeComment}>
                  <input type="hidden" name="comment_id" value={c.id} />
                  <input type="hidden" name="recipe_id" value={recipeId} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    title="Delete note"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </form>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                {c.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
