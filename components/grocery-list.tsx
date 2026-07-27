"use client";

import { useState } from "react";
import { Check, Copy, Trash2 } from "lucide-react";
import {
  toggleGroceryItem,
  deleteGroceryItem,
} from "@/app/(app)/grocery/actions";
import type { GroceryItem } from "@/lib/types";

function fmtQty(q: number | null): string {
  if (q === null) return "";
  return Number.isInteger(q) ? String(q) : String(Number(q.toFixed(2)));
}

function itemLabel(item: GroceryItem): string {
  const qty = fmtQty(item.quantity);
  const parts = [qty, item.unit ?? "", item.name].filter(Boolean);
  return parts.join(" ");
}

function Row({ item }: { item: GroceryItem }) {
  return (
    <li className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
      <form action={toggleGroceryItem} className="flex items-center">
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="checked" value={(!item.checked).toString()} />
        <input
          type="checkbox"
          checked={item.checked}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
        />
      </form>
      <span
        className={
          "flex-1 text-sm " +
          (item.checked
            ? "text-zinc-400 line-through"
            : "text-zinc-800 dark:text-zinc-200")
        }
      >
        {itemLabel(item)}
      </span>
      <form action={deleteGroceryItem}>
        <input type="hidden" name="id" value={item.id} />
        <button
          type="submit"
          className="text-zinc-300 hover:text-red-600"
          title="Remove item"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </form>
    </li>
  );
}

export function GroceryList({ items }: { items: GroceryItem[] }) {
  const [copied, setCopied] = useState(false);
  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  const copy = async () => {
    const text = items.map((i) => `- ${itemLabel(i)}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {unchecked.length} to buy · {checked.length} in cart
        </span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copy list
            </>
          )}
        </button>
      </div>

      <ul className="flex flex-col p-2">
        {unchecked.map((item) => (
          <Row key={item.id} item={item} />
        ))}
      </ul>

      {checked.length > 0 && (
        <div className="border-t border-zinc-100 dark:border-zinc-800">
          <p className="px-4 pt-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
            In cart
          </p>
          <ul className="flex flex-col p-2">
            {checked.map((item) => (
              <Row key={item.id} item={item} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
