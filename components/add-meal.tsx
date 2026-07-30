"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Plus, Search, X } from "lucide-react";
import { addMealEntry } from "@/app/(app)/planner/actions";
import { RecipeOriginBadge } from "@/components/recipe-origin-badge";

type RecipeOption = { id: string; title: string; origin?: string | null };

export function AddMeal({
  kitchenId,
  week,
  day,
  mealType,
  recipes,
}: {
  kitchenId: string;
  week: string;
  day: number;
  mealType: string;
  recipes: RecipeOption[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const [menuBox, setMenuBox] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipes.slice(0, 8);
    return recipes
      .filter((r) => r.title.toLowerCase().includes(q))
      .slice(0, 12);
  }, [recipes, query]);

  const updateMenuBox = () => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuBox({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 180),
    });
  };

  useLayoutEffect(() => {
    if (!open) {
      setMenuBox(null);
      return;
    }
    updateMenuBox();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      const menu = document.getElementById("meal-search-menu");
      if (menu?.contains(target)) return;
      setOpen(false);
      setQuery("");
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    const onReposition = () => updateMenuBox();

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  const pick = (recipeId: string) => {
    const fd = new FormData();
    fd.set("kitchenId", kitchenId);
    fd.set("week", week);
    fd.set("day", String(day));
    fd.set("mealType", mealType);
    fd.set("recipeId", recipeId);
    startTransition(async () => {
      await addMealEntry(fd);
      setOpen(false);
      setQuery("");
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 flex w-full items-center gap-1 rounded-md border border-dashed border-zinc-300 px-2 py-1 text-xs text-zinc-400 hover:border-emerald-400 hover:text-emerald-600 dark:border-zinc-700"
      >
        <Plus className="h-3 w-3" />
        Add recipe
      </button>
    );
  }

  return (
    <div ref={rootRef} className="relative mt-1">
      <div className="flex items-center gap-1 rounded-md border border-emerald-400 bg-white px-1.5 py-1 dark:bg-zinc-900">
        <Search className="h-3 w-3 shrink-0 text-zinc-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search meals…"
          disabled={pending}
          className="min-w-0 flex-1 bg-transparent text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
        />
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setQuery("");
          }}
          className="text-zinc-400 hover:text-zinc-700"
          title="Close"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {menuBox &&
        createPortal(
          <ul
            id="meal-search-menu"
            style={{
              position: "fixed",
              top: menuBox.top,
              left: menuBox.left,
              width: menuBox.width,
            }}
            className="z-50 max-h-48 overflow-y-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          >
            {filtered.length === 0 ? (
              <li className="px-2 py-1.5 text-xs text-zinc-400">
                No meals found
              </li>
            ) : (
              filtered.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => pick(r.id)}
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs text-zinc-700 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-50 dark:text-zinc-200 dark:hover:bg-emerald-950 dark:hover:text-emerald-200"
                  >
                    <span className="min-w-0 flex-1 truncate">{r.title}</span>
                    <RecipeOriginBadge
                      origin={r.origin ?? "user"}
                      compact
                    />
                  </button>
                </li>
              ))
            )}
          </ul>,
          document.body,
        )}
    </div>
  );
}
