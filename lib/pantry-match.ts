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
  /** Fewer missing ingredients = closer match (used for sorting). */
  missingCount: number;
  ready: boolean;
  favorite: boolean;
  /** 1–3 profile rank when applicable; lower is higher priority. */
  favoriteRank: number | null;
};

/**
 * Score recipes against a pantry name list (quantity not considered).
 * Sorted by closest match (highest coverage, fewest missing), with favorites
 * ranked ahead of non-favorites when scores tie.
 */
export function matchRecipesToPantry(
  recipes: PantryMatchRecipe[],
  pantryNames: string[],
  favoriteById: Map<string, number> = new Map(),
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
    const favoriteRank = favoriteById.get(recipe.id) ?? null;
    results.push({
      recipe,
      matched,
      missing,
      total,
      matchCount,
      score,
      missingCount: missing.length,
      ready: missing.length === 0,
      favorite: favoriteRank != null,
      favoriteRank,
    });
  }

  results.sort((a, b) => {
    // Closest match first: higher coverage, then fewer missing ingredients.
    if (b.score !== a.score) return b.score - a.score;
    if (a.missingCount !== b.missingCount) {
      return a.missingCount - b.missingCount;
    }
    if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
    // Favorites before non-favorites on a tie; better rank (1) first.
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
    if (a.favoriteRank != null && b.favoriteRank != null) {
      return a.favoriteRank - b.favoriteRank;
    }
    if (a.ready !== b.ready) return a.ready ? -1 : 1;
    return a.recipe.title.localeCompare(b.recipe.title);
  });

  return results;
}
