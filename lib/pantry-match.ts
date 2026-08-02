/** Normalize free-text ingredient / pantry names for fuzzy matching. */
export function normalizeIngredientName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when pantry item and recipe ingredient refer to the same thing. */
export function ingredientNamesMatch(a: string, b: string): boolean {
  const na = normalizeIngredientName(a);
  const nb = normalizeIngredientName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;

  const stripPlural = (s: string) => {
    if (s.endsWith("ies") && s.length > 4) return `${s.slice(0, -3)}y`;
    if (s.endsWith("oes") && s.length > 4) return s.slice(0, -2);
    if (s.endsWith("ses") && s.length > 4) return s.slice(0, -2);
    if (s.endsWith("s") && !s.endsWith("ss") && s.length > 3) return s.slice(0, -1);
    return s;
  };

  if (stripPlural(na) === stripPlural(nb)) return true;

  // Substring match for "garlic" ↔ "garlic cloves", require meaningful length.
  if (na.length >= 4 && nb.length >= 4) {
    if (na.includes(nb) || nb.includes(na)) return true;
  }

  return false;
}

export type PantryMatchRecipe = {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  owner_id: string;
  image_url: string | null;
  ingredients: { name: string }[];
};

export type RecipePantryMatch = {
  recipe: PantryMatchRecipe;
  matched: string[];
  missing: string[];
  total: number;
  matchCount: number;
  /** 0–1 coverage of unique ingredient names. */
  score: number;
  ready: boolean;
};

/** Score recipes against a pantry name list (quantity not considered). */
export function matchRecipesToPantry(
  recipes: PantryMatchRecipe[],
  pantryNames: string[],
): RecipePantryMatch[] {
  const pantry = pantryNames.map(normalizeIngredientName).filter(Boolean);
  if (pantry.length === 0) return [];

  const results: RecipePantryMatch[] = [];

  for (const recipe of recipes) {
    const unique = new Map<string, string>();
    for (const ing of recipe.ingredients) {
      const key = normalizeIngredientName(ing.name);
      if (!key) continue;
      if (!unique.has(key)) unique.set(key, ing.name.trim());
    }
    if (unique.size === 0) continue;

    const matched: string[] = [];
    const missing: string[] = [];
    for (const [, display] of unique) {
      const hit = pantry.some((p) => ingredientNamesMatch(p, display));
      if (hit) matched.push(display);
      else missing.push(display);
    }

    const total = unique.size;
    const matchCount = matched.length;
    const score = matchCount / total;
    results.push({
      recipe,
      matched,
      missing,
      total,
      matchCount,
      score,
      ready: missing.length === 0,
    });
  }

  results.sort((a, b) => {
    if (a.ready !== b.ready) return a.ready ? -1 : 1;
    if (b.score !== a.score) return b.score - a.score;
    if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
    return a.recipe.title.localeCompare(b.recipe.title);
  });

  return results;
}
