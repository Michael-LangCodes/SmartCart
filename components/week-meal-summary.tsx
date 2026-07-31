import { DAYS, MEAL_TYPES } from "@/lib/utils";
import { formatMacro, hasNutrition } from "@/lib/recipe-meta";
import { hasMacroTargets, type MacroTargets } from "@/lib/diet";

type RecipeNutrition = {
  id: string;
  title: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
};

type EntryRow = {
  id: string;
  day_of_week: number;
  meal_type: string;
  recipes: RecipeNutrition | null;
};

type Totals = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
};

const EMPTY: Totals = {
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  fiber_g: 0,
};

function num(n: number | null | undefined): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

function addNutrition(into: Totals, recipe: RecipeNutrition | null): void {
  if (!recipe || !hasNutrition(recipe)) return;
  into.calories += num(recipe.calories);
  into.protein_g += num(recipe.protein_g);
  into.carbs_g += num(recipe.carbs_g);
  into.fat_g += num(recipe.fat_g);
  into.fiber_g += num(recipe.fiber_g);
}

function MacroStat({
  label,
  value,
  unit,
  emphasize,
}: {
  label: string;
  value: string;
  unit: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={
        emphasize
          ? "rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-950/40"
          : "rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-950/50"
      }
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p
        className={
          emphasize
            ? "mt-0.5 text-lg font-semibold tabular-nums text-emerald-800 dark:text-emerald-200"
            : "mt-0.5 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100"
        }
      >
        {value}
        <span className="ml-1 text-xs font-normal text-zinc-500">{unit}</span>
      </p>
    </div>
  );
}

function TargetProgress({
  label,
  actual,
  target,
  unit,
}: {
  label: string;
  actual: number;
  target: number | null;
  unit: string;
}) {
  if (target === null || target <= 0) return null;
  const pct = Math.min(150, Math.round((actual / target) * 100));
  const over = actual > target * 1.05;
  const under = actual < target * 0.9;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </span>
        <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
          {formatMacro(Math.round(actual))} / {formatMacro(target)} {unit}
          <span
            className={
              over
                ? "ml-1 text-amber-700 dark:text-amber-300"
                : under
                  ? "ml-1 text-sky-700 dark:text-sky-300"
                  : "ml-1 text-emerald-700 dark:text-emerald-300"
            }
          >
            ({pct}%)
          </span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={
            over
              ? "h-full rounded-full bg-amber-500"
              : under
                ? "h-full rounded-full bg-sky-500"
                : "h-full rounded-full bg-emerald-600"
          }
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

/** Readable list of every meal planned for the week, with nutrition highlights. */
export function WeekMealSummary({
  entries,
  dayDates,
  weekLabel,
  macroTargets,
}: {
  entries: EntryRow[];
  dayDates: string[];
  weekLabel: string;
  macroTargets?: MacroTargets | null;
}) {
  const total = entries.length;
  const withNutrition = entries.filter((e) => hasNutrition(e.recipes));
  const nutritionCount = withNutrition.length;
  const missingCount = total - nutritionCount;

  const weekTotals = { ...EMPTY };
  for (const e of entries) addNutrition(weekTotals, e.recipes);

  const daysWithFood = new Set(entries.map((e) => e.day_of_week)).size;
  const avgDays = Math.max(daysWithFood, 1);

  const dayTotals = DAYS.map((_, dayIdx) => {
    const totals = { ...EMPTY };
    let meals = 0;
    let nutritionMeals = 0;
    for (const e of entries) {
      if (e.day_of_week !== dayIdx) continue;
      meals += 1;
      if (hasNutrition(e.recipes)) {
        nutritionMeals += 1;
        addNutrition(totals, e.recipes);
      }
    }
    return { totals, meals, nutritionMeals };
  });

  let peakCalDay = -1;
  let peakCal = 0;
  let peakProteinDay = -1;
  let peakProtein = 0;
  dayTotals.forEach((d, i) => {
    if (d.nutritionMeals > 0 && d.totals.calories >= peakCal) {
      peakCal = d.totals.calories;
      peakCalDay = i;
    }
    if (d.nutritionMeals > 0 && d.totals.protein_g >= peakProtein) {
      peakProtein = d.totals.protein_g;
      peakProteinDay = i;
    }
  });

  let topProteinMeal: { title: string; protein: number } | null = null;
  for (const e of withNutrition) {
    const p = num(e.recipes?.protein_g);
    if (!topProteinMeal || p > topProteinMeal.protein) {
      topProteinMeal = {
        title: e.recipes?.title ?? "Recipe",
        protein: p,
      };
    }
  }

  const proteinCal = weekTotals.protein_g * 4;
  const carbsCal = weekTotals.carbs_g * 4;
  const fatCal = weekTotals.fat_g * 9;
  const macroCalTotal = proteinCal + carbsCal + fatCal;
  const macroShares =
    macroCalTotal > 0
      ? {
          protein: Math.round((proteinCal / macroCalTotal) * 100),
          carbs: Math.round((carbsCal / macroCalTotal) * 100),
          fat: Math.round((fatCal / macroCalTotal) * 100),
        }
      : null;

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
          {nutritionCount > 0
            ? ` · ${nutritionCount} with nutrition estimates`
            : ""}
        </p>
      </div>

      {total === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No meals planned for this week yet. Add recipes in the grid above.
        </p>
      ) : (
        <>
          {nutritionCount > 0 ? (
            <div className="mb-5 space-y-4">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Estimated nutrition (week total)
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  <MacroStat
                    label="Calories"
                    value={formatMacro(weekTotals.calories) ?? "0"}
                    unit="kcal"
                    emphasize
                  />
                  <MacroStat
                    label="Protein"
                    value={formatMacro(weekTotals.protein_g) ?? "0"}
                    unit="g"
                  />
                  <MacroStat
                    label="Carbs"
                    value={formatMacro(weekTotals.carbs_g) ?? "0"}
                    unit="g"
                  />
                  <MacroStat
                    label="Fat"
                    value={formatMacro(weekTotals.fat_g) ?? "0"}
                    unit="g"
                  />
                  <MacroStat
                    label="Fiber"
                    value={formatMacro(weekTotals.fiber_g) ?? "0"}
                    unit="g"
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  Daily avg (~{daysWithFood} day
                  {daysWithFood === 1 ? "" : "s"} with meals):{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {formatMacro(Math.round(weekTotals.calories / avgDays))}{" "}
                    kcal
                  </span>
                  {" · "}
                  {formatMacro(
                    Math.round(weekTotals.protein_g / avgDays),
                  )}
                  g protein
                  {" · "}
                  {formatMacro(Math.round(weekTotals.carbs_g / avgDays))}g
                  carbs
                  {" · "}
                  {formatMacro(Math.round(weekTotals.fat_g / avgDays))}g fat
                </p>
              </div>

              {hasMacroTargets(macroTargets) && macroTargets && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Vs your daily targets
                  </p>
                  <div className="flex flex-col gap-2.5">
                    <TargetProgress
                      label="Calories"
                      actual={weekTotals.calories / avgDays}
                      target={macroTargets.target_calories}
                      unit="kcal"
                    />
                    <TargetProgress
                      label="Protein"
                      actual={weekTotals.protein_g / avgDays}
                      target={macroTargets.target_protein_g}
                      unit="g"
                    />
                    <TargetProgress
                      label="Carbs"
                      actual={weekTotals.carbs_g / avgDays}
                      target={macroTargets.target_carbs_g}
                      unit="g"
                    />
                    <TargetProgress
                      label="Fat"
                      actual={weekTotals.fat_g / avgDays}
                      target={macroTargets.target_fat_g}
                      unit="g"
                    />
                    <TargetProgress
                      label="Fiber"
                      actual={weekTotals.fiber_g / avgDays}
                      target={macroTargets.target_fiber_g}
                      unit="g"
                    />
                  </div>
                  <p className="mt-2 text-xs text-zinc-400">
                    Compares daily averages from planned meals to your profile
                    targets.
                  </p>
                </div>
              )}

              {macroShares && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Macro split (by calories)
                  </p>
                  <div className="flex h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="bg-emerald-600 dark:bg-emerald-500"
                      style={{ width: `${macroShares.protein}%` }}
                      title={`Protein ${macroShares.protein}%`}
                    />
                    <div
                      className="bg-sky-500 dark:bg-sky-400"
                      style={{ width: `${macroShares.carbs}%` }}
                      title={`Carbs ${macroShares.carbs}%`}
                    />
                    <div
                      className="bg-amber-500 dark:bg-amber-400"
                      style={{ width: `${macroShares.fat}%` }}
                      title={`Fat ${macroShares.fat}%`}
                    />
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>
                      <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-600" />
                      Protein {macroShares.protein}%
                    </span>
                    <span>
                      <span className="mr-1 inline-block h-2 w-2 rounded-full bg-sky-500" />
                      Carbs {macroShares.carbs}%
                    </span>
                    <span>
                      <span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" />
                      Fat {macroShares.fat}%
                    </span>
                  </div>
                </div>
              )}

              <ul className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
                {peakCalDay >= 0 && (
                  <li>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      Highest calorie day:
                    </span>{" "}
                    {DAYS[peakCalDay]} ({formatMacro(peakCal)} kcal)
                  </li>
                )}
                {peakProteinDay >= 0 && (
                  <li>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      Highest protein day:
                    </span>{" "}
                    {DAYS[peakProteinDay]} ({formatMacro(peakProtein)}g)
                  </li>
                )}
                {topProteinMeal && topProteinMeal.protein > 0 && (
                  <li>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      Top protein meal:
                    </span>{" "}
                    {topProteinMeal.title} (
                    {formatMacro(topProteinMeal.protein)}g)
                  </li>
                )}
              </ul>

              {missingCount > 0 && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {missingCount} meal{missingCount === 1 ? "" : "s"} missing
                  nutrition estimates — totals only include recipes with data.
                </p>
              )}
            </div>
          ) : (
            <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
              None of this week&apos;s recipes have estimated nutrition yet. Add
              calories and macros on a recipe to see week totals here.
            </p>
          )}

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
              const { totals, nutritionMeals } = dayTotals[dayIdx];
              const isPeakCal = peakCalDay === dayIdx && nutritionMeals > 0;
              const isPeakProtein =
                peakProteinDay === dayIdx && nutritionMeals > 0;

              return (
                <div
                  key={day}
                  className={
                    isPeakCal
                      ? "rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30"
                      : "rounded-lg border border-zinc-100 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-950/40"
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      {day}{" "}
                      <span className="font-normal text-zinc-400">
                        {dayDates[dayIdx]}
                      </span>
                    </p>
                    {nutritionMeals > 0 && (
                      <p className="shrink-0 text-right text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {formatMacro(totals.calories)} kcal
                        </span>
                        {totals.protein_g > 0 && (
                          <>
                            <br />
                            {formatMacro(totals.protein_g)}g protein
                          </>
                        )}
                      </p>
                    )}
                  </div>
                  {(isPeakCal || isPeakProtein) && (
                    <p className="mt-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                      {[
                        isPeakCal ? "Most calories" : null,
                        isPeakProtein ? "Most protein" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  {dayEntries.length === 0 ? (
                    <p className="mt-2 text-xs text-zinc-400">No meals</p>
                  ) : (
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {dayEntries.map((entry) => {
                        const cal = formatMacro(entry.recipes?.calories);
                        return (
                          <li
                            key={entry.id}
                            className="flex items-baseline gap-2 text-sm"
                          >
                            <span className="w-16 shrink-0 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                              {entry.meal_type}
                            </span>
                            <span className="min-w-0 flex-1 text-zinc-800 dark:text-zinc-200">
                              {entry.recipes?.title ?? "Recipe"}
                              {cal && (
                                <span className="mt-0.5 block text-xs font-normal text-zinc-500 dark:text-zinc-400">
                                  ~{cal} kcal
                                  {entry.recipes?.protein_g != null &&
                                    Number.isFinite(
                                      Number(entry.recipes.protein_g),
                                    ) && (
                                      <>
                                        {" "}
                                        ·{" "}
                                        {formatMacro(entry.recipes.protein_g)}g
                                        protein
                                      </>
                                    )}
                                </span>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
