import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingCart, CalendarDays, BookOpen, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { REQUIRE_AUTH } from "@/lib/auth-config";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: BookOpen,
    title: "Recipe library",
    body: "Save your own recipes and browse a shared community library.",
  },
  {
    icon: CalendarDays,
    title: "Weekly planner",
    body: "Drop recipes into a Monday-Sunday grid for every meal.",
  },
  {
    icon: ShoppingCart,
    title: "Auto grocery lists",
    body: "Generate a combined shopping list from the week's meals.",
  },
  {
    icon: Users,
    title: "Shared kitchens",
    body: "Invite housemates to a kitchen and plan together.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/planner");

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <ShoppingCart className="h-6 w-6 text-emerald-600" />
          SmartCart
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href={REQUIRE_AUTH ? "/signup" : "/planner"}>
            <Button size="sm">
              {REQUIRE_AUTH ? "Get started" : "Open the app"}
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <span className="mb-4 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          Plan. Shop. Cook.
        </span>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
          Plan your week of meals and never wonder what to buy again.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          SmartCart turns your weekly meal plan into an organized grocery list
          you can share with your whole kitchen.
        </p>
        <div className="mt-8 flex gap-3">
          {REQUIRE_AUTH ? (
            <>
              <Link href="/signup">
                <Button size="md">Create free account</Button>
              </Link>
              <Link href="/login">
                <Button size="md" variant="outline">
                  Sign in
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/planner">
                <Button size="md">Open the app</Button>
              </Link>
              <Link href="/login">
                <Button size="md" variant="outline">
                  Sign in
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-zinc-200 bg-white p-5 text-left dark:border-zinc-800 dark:bg-zinc-900"
            >
              <f.icon className="h-6 w-6 text-emerald-600" />
              <h3 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-100">
                {f.title}
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
