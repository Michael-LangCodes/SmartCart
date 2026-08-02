/**
 * Application-level TypeScript types mirroring the Supabase schema.
 * These are hand-maintained; keep them in sync with supabase/migrations.
 */

import type { DietType } from "@/lib/diet";

export type Profile = {
  id: string;
  display_name: string | null;
  allergies: string[];
  diet_type: DietType;
  serving_multiplier: number;
  /** Daily targets (optional). */
  target_calories: number | null;
  target_protein_g: number | null;
  target_carbs_g: number | null;
  target_fat_g: number | null;
  target_fiber_g: number | null;
  created_at: string;
};

export type ProfileFavoriteRecipe = {
  profile_id: string;
  recipe_id: string;
  position: number;
  created_at: string;
};

export type RecipeOrigin = "user" | "cookbook";

export type Recipe = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  servings: number | null;
  difficulty: "easy" | "medium" | "hard" | null;
  prep_minutes: number | null;
  cook_minutes: number | null;
  tags: string[];
  origin: RecipeOrigin;
  source_recipe_id: string | null;
  /** Estimated nutrition per serving. */
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  /** Optional cover image (https URL). */
  image_url: string | null;
  is_public: boolean;
  created_at: string;
};

export type RecipeIngredient = {
  id: string;
  recipe_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  position: number;
};

export type RecipeWithIngredients = Recipe & {
  recipe_ingredients: RecipeIngredient[];
};

export type RecipeRating = {
  recipe_id: string;
  user_id: string;
  rating: number;
  created_at: string;
  updated_at: string;
};

export type RecipeComment = {
  id: string;
  recipe_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export type RecipeCommentWithAuthor = RecipeComment & {
  author_name: string;
};

/** Private notes on a recipe you own (My Recipes). */
export type RecipePersonalComment = {
  id: string;
  recipe_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export type RecipeRatingSummary = {
  average: number;
  count: number;
};

export type Kitchen = {
  id: string;
  name: string;
  created_by: string;
  invite_code: string;
  created_at: string;
};

export type KitchenRole = "owner" | "member";

export type KitchenMember = {
  kitchen_id: string;
  user_id: string;
  role: KitchenRole;
  created_at: string;
};

export type KitchenMemberWithProfile = KitchenMember & {
  profiles: Pick<Profile, "id" | "display_name"> | null;
};

/** Non-account household person (no login). */
export type KitchenPerson = {
  id: string;
  kitchen_id: string;
  name: string;
  allergies: string[];
  diet_type: DietType;
  serving_multiplier: number;
  notes: string | null;
  created_at: string;
};

/** Shared pantry inventory item for a kitchen. */
export type KitchenPantryItem = {
  id: string;
  kitchen_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type KitchenPersonFavorite = {
  person_id: string;
  recipe_id: string;
  position: number;
  created_at: string;
};

export type KitchenPersonWithFavorites = KitchenPerson & {
  kitchen_person_favorites: (KitchenPersonFavorite & {
    recipes: Pick<Recipe, "id" | "title"> | null;
  })[];
};

export type MealPlan = {
  id: string;
  kitchen_id: string;
  week_start: string; // ISO date (Monday)
  created_at: string;
};

export type MealPlanEntry = {
  id: string;
  meal_plan_id: string;
  day_of_week: number; // 0 = Monday ... 6 = Sunday
  meal_type: string;
  recipe_id: string;
  created_at: string;
};

export type MealPlanEntryWithRecipe = MealPlanEntry & {
  recipes: Pick<Recipe, "id" | "title"> | null;
};

export type GroceryItem = {
  id: string;
  meal_plan_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  checked: boolean;
  created_at: string;
};
