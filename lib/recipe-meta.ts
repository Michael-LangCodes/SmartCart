/** Difficulty / timing helpers for recipes. */

export const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
] as const;

export type Difficulty = (typeof DIFFICULTY_OPTIONS)[number]["value"];

export function isDifficulty(value: string): value is Difficulty {
  return DIFFICULTY_OPTIONS.some((d) => d.value === value);
}

export function difficultyLabel(value: string | null | undefined): string {
  if (!value) return "";
  return DIFFICULTY_OPTIONS.find((d) => d.value === value)?.label ?? value;
}

/** Format minutes as "15 min" or "1 hr 20 min". */
export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) {
    return "";
  }
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const hrs = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${hrs} hr` : `${hrs} hr ${rem} min`;
}

/** Compact meta line for recipe cards, e.g. "Easy · prep 15 min · cook 30 min". */
export function recipeTimingLine(recipe: {
  difficulty?: string | null;
  prep_minutes?: number | null;
  cook_minutes?: number | null;
}): string {
  const parts: string[] = [];
  const diff = difficultyLabel(recipe.difficulty);
  if (diff) parts.push(diff);
  const prep = formatMinutes(recipe.prep_minutes);
  if (prep) parts.push(`prep ${prep}`);
  const cook = formatMinutes(recipe.cook_minutes);
  if (cook) parts.push(`cook ${cook}`);
  return parts.join(" · ");
}
