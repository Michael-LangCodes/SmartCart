import { Star } from "lucide-react";
import type { RecipeRatingSummary } from "@/lib/types";

/** Compact average rating for cards, e.g. "4.5 (12)". */
export function formatRatingSummary(
  summary: RecipeRatingSummary | null | undefined,
): string | null {
  if (!summary || summary.count === 0) return null;
  const avg =
    Number.isInteger(summary.average) || summary.average % 1 === 0
      ? String(summary.average)
      : summary.average.toFixed(1);
  return `${avg} (${summary.count})`;
}

/** Read-only star row for average or a single rating. */
export function StarRatingDisplay({
  value,
  count,
  size = "sm",
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
}) {
  const iconClass = size === "md" ? "h-5 w-5" : "h-3.5 w-3.5";
  const rounded = Math.round(value * 2) / 2;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = rounded >= n;
          const half = !filled && rounded >= n - 0.5;
          return (
            <Star
              key={n}
              className={`${iconClass} ${
                filled
                  ? "fill-amber-400 text-amber-400"
                  : half
                    ? "fill-amber-400/50 text-amber-400"
                    : "text-zinc-300 dark:text-zinc-600"
              }`}
            />
          );
        })}
      </span>
      {count !== undefined && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {value > 0 ? value.toFixed(1).replace(/\.0$/, "") : "—"}
          {count > 0 ? ` · ${count}` : " · no ratings"}
        </span>
      )}
    </span>
  );
}
