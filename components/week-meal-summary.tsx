import { DAYS, MEAL_TYPES } from "@/lib/utils";

type EntryRow = {
  id: string;
  day_of_week: number;
  meal_type: string;
  recipes: { id: string; title: string } | null;
};

/** Readable list of every meal planned for the week, grouped by day. */
export function WeekMealSummary({
  entries,
  dayDates,
  weekLabel,
}: {
  entries: EntryRow[];
  dayDates: string[];
  weekLabel: string;
}) {
  const total = entries.length;

  return (
    <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Week summary
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {weekLabel}
          </p>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {total} meal{total === 1 ? "" : "s"} planned
        </p>
      </div>

      {total === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No meals planned for this week yet. Add recipes in the grid above.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {DAYS.map((day, dayIdx) => {
            const dayEntries = entries
              .filter((e) => e.day_of_week === dayIdx)
              .sort((a, b) => {
                const ai = MEAL_TYPES.indexOf(
                  a.meal_type as (typeof MEAL_TYPES)[number],
                );
                const bi = MEAL_TYPES.indexOf(
                  b.meal_type as (typeof MEAL_TYPES)[number],
                );
                return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
              });

            return (
              <div
                key={day}
                className="rounded-lg border border-zinc-100 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-950/40"
              >
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {day}{" "}
                  <span className="font-normal text-zinc-400">
                    {dayDates[dayIdx]}
                  </span>
                </p>
                {dayEntries.length === 0 ? (
                  <p className="mt-2 text-xs text-zinc-400">No meals</p>
                ) : (
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {dayEntries.map((entry) => (
                      <li
                        key={entry.id}
                        className="flex items-baseline gap-2 text-sm"
                      >
                        <span className="w-16 shrink-0 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          {entry.meal_type}
                        </span>
                        <span className="min-w-0 text-zinc-800 dark:text-zinc-200">
                          {entry.recipes?.title ?? "Recipe"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
