import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CalendarDays,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getActiveKitchen } from "@/lib/kitchen";
import { getWeekStart, addWeeks, formatWeekRange } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GroceryList } from "@/components/grocery-list";
import { generateGroceryList, addGroceryItem } from "./actions";
import type { GroceryItem } from "@/lib/types";

export const dynamic = "force-dynamic";

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function GroceryPage({
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
  const activeKitchen = await getActiveKitchen();

  if (!activeKitchen) {
    return (
      <div>
        <PageHeader title="Grocery List" />
        <EmptyState
          title="Create a kitchen first"
          description="Grocery lists are generated from a kitchen's weekly meal plan."
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

  let items: GroceryItem[] = [];
  let mealCount = 0;
  if (mealPlan) {
    const [{ data: groceryRows }, { count }] = await Promise.all([
      supabase
        .from("grocery_items")
        .select("*")
        .eq("meal_plan_id", mealPlan.id)
        .order("name"),
      supabase
        .from("meal_plan_entries")
        .select("id", { count: "exact", head: true })
        .eq("meal_plan_id", mealPlan.id),
    ]);
    items = (groceryRows ?? []) as GroceryItem[];
    mealCount = count ?? 0;
  }

  return (
    <div>
      <PageHeader
        title="Grocery List"
        description={`Shared with everyone in ${activeKitchen.name}`}
        action={
          <Link href="/planner">
            <Button variant="outline">
              <CalendarDays className="h-4 w-4" /> Planner
            </Button>
          </Link>
        }
      />

      <div className="mb-4 flex items-center justify-between gap-2">
        <Link href={`/grocery?week=${addWeeks(week, -1)}`}>
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
              href="/grocery"
              className="text-xs text-emerald-600 hover:underline"
            >
              This week
            </Link>
          )}
        </div>
        <Link href={`/grocery?week=${addWeeks(week, 1)}`}>
          <Button variant="outline" size="sm">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-zinc-100 px-4 py-3 dark:bg-zinc-800/60">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {mealCount} meal{mealCount === 1 ? "" : "s"} planned this week.
        </p>
        <form action={generateGroceryList}>
          <input type="hidden" name="kitchenId" value={activeKitchen.id} />
          <input type="hidden" name="week" value={week} />
          <Button type="submit" size="sm">
            <RefreshCw className="h-4 w-4" />
            {items.length > 0 ? "Regenerate from plan" : "Generate from plan"}
          </Button>
        </form>
      </div>

      {/* Manual add */}
      <form
        action={addGroceryItem}
        className="mb-4 flex flex-wrap items-end gap-2"
      >
        <input type="hidden" name="kitchenId" value={activeKitchen.id} />
        <input type="hidden" name="week" value={week} />
        <Input
          name="quantity"
          placeholder="Qty"
          inputMode="decimal"
          className="w-20"
        />
        <Input name="unit" placeholder="Unit" className="w-24" />
        <Input
          name="name"
          placeholder="Add an item (e.g. Paper towels)"
          className="min-w-[180px] flex-1"
          required
        />
        <Button type="submit" variant="secondary">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </form>

      {items.length === 0 ? (
        <EmptyState
          title="Your grocery list is empty"
          description={
            mealCount > 0
              ? "Generate the list from this week's plan, or add items manually above."
              : "Plan some meals for this week, then generate your grocery list."
          }
          action={
            mealCount === 0 ? (
              <Link href="/planner">
                <Button>Plan meals</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <GroceryList items={items} />
      )}
    </div>
  );
}
