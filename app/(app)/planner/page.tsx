import Link from "next/link";
import { ChevronLeft, ChevronRight, X, ShoppingCart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getActiveKitchen } from "@/lib/kitchen";
import {
  DAYS,
  MEAL_TYPES,
  getWeekStart,
  addWeeks,
  formatWeekRange,
} from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { AddMeal } from "@/components/add-meal";
import { removeMealEntry } from "./actions";

export const dynamic = "force-dynamic";

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

type EntryRow = {
  id: string;
  day_of_week: number;
  meal_type: string;
  recipes: { id: string; title: string } | null;
};

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week: weekParam } = await searchParams;
  const week =
    weekParam && ISO_RE.test(weekParam)
      ? getWeekStart(new Date(weekParam + "T00:00:00Z"))
      : getWeekStart(new Date());

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const activeKitchen = await getActiveKitchen();

  if (!activeKitchen) {
    return (
      <div>
        <PageHeader title="Weekly Planner" />
        <EmptyState
          title="Create a kitchen to start planning"
          description="Meal plans live inside a kitchen so you can share them. Create or join one first."
          action={
            <Link href="/kitchens">
              <Button>Go to Kitchens</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const { data: mealPlan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("kitchen_id", activeKitchen.id)
    .eq("week_start", week)
    .maybeSingle();

  let entries: EntryRow[] = [];
  if (mealPlan) {
    const { data } = await supabase
      .from("meal_plan_entries")
      .select("id, day_of_week, meal_type, recipes(id, title)")
      .eq("meal_plan_id", mealPlan.id);
    entries = (data ?? []) as unknown as EntryRow[];
  }

  const { data: recipeRows } = await supabase
    .from("recipes")
    .select("id, title")
    .or(`owner_id.eq.${user!.id},is_public.eq.true`)
    .order("title");
  const recipes = (recipeRows ?? []) as { id: string; title: string }[];

  const bySlot = new Map<string, EntryRow[]>();
  for (const e of entries) {
    const key = `${e.day_of_week}_${e.meal_type}`;
    const arr = bySlot.get(key) ?? [];
    arr.push(e);
    bySlot.set(key, arr);
  }

  const dayDates = DAYS.map((_, i) => {
    const d = new Date(week + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + i);
    return d.toLocaleDateString("en-US", {
      day: "numeric",
      timeZone: "UTC",
    });
  });

  return (
    <div>
      <PageHeader
        title="Weekly Planner"
        description={`Planning for ${activeKitchen.name}`}
        action={
          <Link href="/grocery">
            <Button variant="outline">
              <ShoppingCart className="h-4 w-4" /> Grocery list
            </Button>
          </Link>
        }
      />

      <div className="mb-4 flex items-center justify-between gap-2">
        <Link href={`/planner?week=${addWeeks(week, -1)}`}>
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {formatWeekRange(week)}
          </span>
          {week !== getWeekStart(new Date()) && (
            <Link
              href="/planner"
              className="text-xs text-emerald-600 hover:underline"
            >
              This week
            </Link>
          )}
        </div>
        <Link href={`/planner?week=${addWeeks(week, 1)}`}>
          <Button variant="outline" size="sm">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {recipes.length === 0 && (
        <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          You have no recipes yet.{" "}
          <Link href="/recipes/new" className="font-medium underline">
            Add one
          </Link>{" "}
          or grab some from the{" "}
          <Link href="/library" className="font-medium underline">
            community library
          </Link>{" "}
          to start planning.
        </p>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[820px]">
          {/* Header row */}
          <div className="grid grid-cols-[90px_repeat(7,1fr)] gap-2">
            <div />
            {DAYS.map((day, i) => (
              <div
                key={day}
                className="rounded-md bg-zinc-100 px-2 py-1.5 text-center text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {day.slice(0, 3)}{" "}
                <span className="font-normal text-zinc-400">{dayDates[i]}</span>
              </div>
            ))}
          </div>

          {/* Meal rows */}
          {MEAL_TYPES.map((mealType) => (
            <div
              key={mealType}
              className="mt-2 grid grid-cols-[90px_repeat(7,1fr)] gap-2"
            >
              <div className="flex items-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {mealType}
              </div>
              {DAYS.map((_, dayIdx) => {
                const slotEntries = bySlot.get(`${dayIdx}_${mealType}`) ?? [];
                return (
                  <div
                    key={dayIdx}
                    className="min-h-[72px] rounded-md border border-zinc-200 bg-white p-1.5 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex flex-col gap-1">
                      {slotEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between gap-1 rounded bg-emerald-50 px-1.5 py-1 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                        >
                          <span className="truncate">
                            {entry.recipes?.title ?? "Recipe"}
                          </span>
                          <form action={removeMealEntry}>
                            <input type="hidden" name="entryId" value={entry.id} />
                            <button
                              type="submit"
                              className="text-emerald-500 hover:text-red-600"
                              title="Remove"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </form>
                        </div>
                      ))}
                    </div>
                    {recipes.length > 0 && (
                      <AddMeal
                        kitchenId={activeKitchen.id}
                        week={week}
                        day={dayIdx}
                        mealType={mealType}
                        recipes={recipes}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
