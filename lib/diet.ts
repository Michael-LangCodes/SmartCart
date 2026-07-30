/** Shared diet / preference helpers used by profile and household people. */

export const DIET_TYPES = [
  { value: "all", label: "All (no restriction)" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
  { value: "other", label: "Other" },
] as const;

export type DietType = (typeof DIET_TYPES)[number]["value"];

export function isDietType(value: string): value is DietType {
  return DIET_TYPES.some((d) => d.value === value);
}

/** Parse a comma/newline-separated allergy list into a clean string[]. */
export function parseAllergies(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function formatAllergies(allergies: string[] | null | undefined): string {
  return (allergies ?? []).join(", ");
}

export function parseServingMultiplier(raw: string, fallback = 1): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(10, Math.round(n * 100) / 100);
}

export function dietLabel(value: string): string {
  return DIET_TYPES.find((d) => d.value === value)?.label ?? value;
}
