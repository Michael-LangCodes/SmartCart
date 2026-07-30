import { BookMarked, PenLine } from "lucide-react";
import type { RecipeOrigin } from "@/lib/types";

export function RecipeOriginBadge({
  origin,
  compact = false,
}: {
  origin?: RecipeOrigin | string | null;
  compact?: boolean;
}) {
  const fromCookbook = origin === "cookbook";

  if (compact) {
    return (
      <span
        className={
          fromCookbook
            ? "rounded bg-amber-100 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-950 dark:text-amber-300"
            : "rounded bg-sky-100 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-sky-800 dark:bg-sky-950 dark:text-sky-300"
        }
        title={fromCookbook ? "From cookbook" : "Your recipe"}
      >
        {fromCookbook ? "Cookbook" : "Yours"}
      </span>
    );
  }

  return (
    <span
      className={
        fromCookbook
          ? "inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300"
          : "inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-950 dark:text-sky-300"
      }
      title={
        fromCookbook
          ? "Added from the community cookbook"
          : "Created by you"
      }
    >
      {fromCookbook ? (
        <>
          <BookMarked className="h-3 w-3" /> From cookbook
        </>
      ) : (
        <>
          <PenLine className="h-3 w-3" /> Your recipe
        </>
      )}
    </span>
  );
}
