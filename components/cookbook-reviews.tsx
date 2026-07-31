"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Trash2 } from "lucide-react";
import {
  rateRecipe,
  addRecipeComment,
  deleteRecipeComment,
} from "@/app/(app)/cookbook/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRatingDisplay } from "@/components/recipe-stars";
import type { RecipeCommentWithAuthor, RecipeRatingSummary } from "@/lib/types";

function RatingForm({
  recipeId,
  myRating,
}: {
  recipeId: string;
  myRating: number | null;
}) {
  const [hover, setHover] = useState(0);
  const [selected, setSelected] = useState(myRating ?? 0);

  return (
    <form action={rateRecipe} className="mt-4 flex flex-col gap-3">
      <input type="hidden" name="recipe_id" value={recipeId} />
      <input type="hidden" name="rating" value={selected || ""} />
      <Label>Rate this recipe</Label>
      <div
        className="flex items-center gap-1"
        onMouseLeave={() => setHover(0)}
        role="radiogroup"
        aria-label="Your rating"
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const active = (hover || selected) >= n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={selected === n}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              className="rounded p-0.5"
              onMouseEnter={() => setHover(n)}
              onClick={() => setSelected(n)}
            >
              <Star
                className={`h-7 w-7 transition-colors ${
                  active
                    ? "fill-amber-400 text-amber-400"
                    : "text-zinc-300 dark:text-zinc-600"
                }`}
              />
            </button>
          );
        })}
      </div>
      <div>
        <Button type="submit" size="sm" disabled={selected < 1}>
          {myRating != null ? "Update rating" : "Submit rating"}
        </Button>
      </div>
    </form>
  );
}

export function CookbookReviews({
  recipeId,
  summary,
  myRating,
  comments,
  canReview,
  currentUserId,
}: {
  recipeId: string;
  summary: RecipeRatingSummary;
  myRating: number | null;
  comments: RecipeCommentWithAuthor[];
  canReview: boolean;
  currentUserId: string;
}) {
  return (
    <div className="mt-8 flex flex-col gap-8 border-t border-zinc-200 pt-8 dark:border-zinc-800">
      <section>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Ratings
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <StarRatingDisplay
            value={summary.average}
            count={summary.count}
            size="md"
          />
          {myRating != null && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Your rating: {myRating}/5
            </span>
          )}
        </div>

        {canReview ? (
          <RatingForm recipeId={recipeId} myRating={myRating} />
        ) : (
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            <Link
              href={`/login?redirect=${encodeURIComponent(`/cookbook/${recipeId}`)}`}
              className="font-medium text-emerald-600 underline"
            >
              Sign in
            </Link>{" "}
            with an account to rate this recipe.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Comments{" "}
          <span className="font-normal text-zinc-400">({comments.length})</span>
        </h2>

        {canReview ? (
          <form action={addRecipeComment} className="mt-3 flex flex-col gap-2">
            <input type="hidden" name="recipe_id" value={recipeId} />
            <Label htmlFor="comment-body" className="sr-only">
              Comment
            </Label>
            <Textarea
              id="comment-body"
              name="body"
              rows={3}
              maxLength={2000}
              required
              placeholder="Share a tip, tweak, or how it turned out…"
            />
            <div>
              <Button type="submit" size="sm">
                Post comment
              </Button>
            </div>
          </form>
        ) : (
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            <Link
              href={`/login?redirect=${encodeURIComponent(`/cookbook/${recipeId}`)}`}
              className="font-medium text-emerald-600 underline"
            >
              Sign in
            </Link>{" "}
            with an account to leave a comment.
          </p>
        )}

        {comments.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            No comments yet. Be the first to share feedback.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {comments.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {c.author_name}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {new Date(c.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  {c.user_id === currentUserId && (
                    <form action={deleteRecipeComment}>
                      <input type="hidden" name="comment_id" value={c.id} />
                      <input type="hidden" name="recipe_id" value={recipeId} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        title="Delete comment"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </form>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                  {c.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
