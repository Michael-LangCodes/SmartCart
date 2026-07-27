"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  CalendarDays,
  BookOpen,
  Library,
  Users,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { setActiveKitchen } from "@/app/(app)/actions";
import { signOut } from "@/app/(auth)/actions";
import type { Kitchen } from "@/lib/types";

const LINKS = [
  { href: "/planner", label: "Planner", icon: CalendarDays },
  { href: "/grocery", label: "Grocery", icon: ShoppingCart },
  { href: "/recipes", label: "My Recipes", icon: BookOpen },
  { href: "/library", label: "Library", icon: Library },
  { href: "/kitchens", label: "Kitchens", icon: Users },
];

export function Nav({
  kitchens,
  activeKitchenId,
  userName,
}: {
  kitchens: Kitchen[];
  activeKitchenId: string | null;
  userName: string;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link
          href="/planner"
          className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100"
        >
          <ShoppingCart className="h-5 w-5 text-emerald-600" />
          SmartCart
        </Link>

        <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto sm:order-2 sm:w-auto">
          {LINKS.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="order-2 ml-auto flex items-center gap-2 sm:order-3">
          {kitchens.length > 0 && (
            <form action={setActiveKitchen}>
              <input type="hidden" name="path" value={pathname} />
              <select
                name="kitchenId"
                defaultValue={activeKitchenId ?? ""}
                onChange={(e) => e.currentTarget.form?.requestSubmit()}
                className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                aria-label="Active kitchen"
              >
                {kitchens.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name}
                  </option>
                ))}
              </select>
            </form>
          )}

          <span className="hidden text-sm text-zinc-500 md:inline dark:text-zinc-400">
            {userName}
          </span>

          <form action={signOut}>
            <button
              type="submit"
              title="Sign out"
              className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
