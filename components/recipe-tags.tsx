"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUGGESTED_TAGS, parseTags } from "@/lib/recipe-meta";

export function RecipeTagsField({
  initialTags = [],
}: {
  initialTags?: string[];
}) {
  const [tags, setTags] = useState<string[]>(() => parseTags(initialTags));
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const next = parseTags([...tags, ...parseTags(raw)]);
    setTags(next);
    setDraft("");
  };

  const remove = (tag: string) =>
    setTags((prev) => prev.filter((t) => t !== tag));

  const toggleSuggested = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : parseTags([...prev, tag]),
    );
  };

  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <Label>Tags</Label>
      <input type="hidden" name="tags" value={tags.join(", ")} />

      <div className="flex flex-wrap gap-1.5">
        {SUGGESTED_TAGS.map((tag) => {
          const on = tags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleSuggested(tag)}
              className={
                on
                  ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                  : "rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-600 hover:border-emerald-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              }
            >
              {tag}
            </button>
          );
        })}
      </div>

      {tags.filter((t) => !(SUGGESTED_TAGS as readonly string[]).includes(t))
        .length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags
            .filter((t) => !(SUGGESTED_TAGS as readonly string[]).includes(t))
            .map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => remove(tag)}
                  className="text-zinc-400 hover:text-red-600"
                  title="Remove tag"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              if (draft.trim()) add(draft);
            }
          }}
          placeholder="Add a custom tag and press Enter"
        />
        <button
          type="button"
          onClick={() => draft.trim() && add(draft)}
          className="h-10 shrink-0 rounded-md border border-zinc-300 px-3 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Add
        </button>
      </div>
      <p className="text-xs text-zinc-500">
        Tap suggestions or type your own (e.g. high protein, weeknight).
      </p>
    </div>
  );
}

export function RecipeTagBadges({
  tags,
  onTagClick,
  activeTags = [],
}: {
  tags: string[] | null | undefined;
  onTagClick?: (tag: string) => void;
  activeTags?: string[];
}) {
  const list = tags ?? [];
  if (list.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {list.map((tag) => {
        const active = activeTags.includes(tag);
        const className = active
          ? "rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white"
          : "rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
        if (onTagClick) {
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onTagClick(tag)}
              className={className + " hover:opacity-80"}
            >
              {tag}
            </button>
          );
        }
        return (
          <span key={tag} className={className}>
            {tag}
          </span>
        );
      })}
    </div>
  );
}
