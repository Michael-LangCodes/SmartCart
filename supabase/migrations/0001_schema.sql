-- SmartCart schema
-- Tables: profiles, recipes, recipe_ingredients, kitchens, kitchen_members,
-- meal_plans, meal_plan_entries, grocery_items.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Short, human-typable invite code for kitchens.
create or replace function public.gen_invite_code()
returns text
language sql
volatile
as $$
  select upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
$$;

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- recipes
-- ---------------------------------------------------------------------------
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  instructions text,
  servings int,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists recipes_owner_id_idx on public.recipes (owner_id);
create index if not exists recipes_is_public_idx on public.recipes (is_public);

-- ---------------------------------------------------------------------------
-- recipe_ingredients
-- ---------------------------------------------------------------------------
create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  name text not null,
  quantity numeric,
  unit text,
  position int not null default 0
);
create index if not exists recipe_ingredients_recipe_id_idx
  on public.recipe_ingredients (recipe_id);

-- ---------------------------------------------------------------------------
-- kitchens (shared "pantry" groups)
-- ---------------------------------------------------------------------------
create table if not exists public.kitchens (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users (id) on delete cascade,
  invite_code text not null unique default public.gen_invite_code(),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- kitchen_members
-- ---------------------------------------------------------------------------
create table if not exists public.kitchen_members (
  kitchen_id uuid not null references public.kitchens (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (kitchen_id, user_id)
);
create index if not exists kitchen_members_user_id_idx
  on public.kitchen_members (user_id);

-- ---------------------------------------------------------------------------
-- meal_plans (one per kitchen per week)
-- ---------------------------------------------------------------------------
create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  kitchen_id uuid not null references public.kitchens (id) on delete cascade,
  week_start date not null,
  created_at timestamptz not null default now(),
  unique (kitchen_id, week_start)
);
create index if not exists meal_plans_kitchen_id_idx
  on public.meal_plans (kitchen_id);

-- ---------------------------------------------------------------------------
-- meal_plan_entries (a recipe assigned to a day + meal slot)
-- ---------------------------------------------------------------------------
create table if not exists public.meal_plan_entries (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans (id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  meal_type text not null,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists meal_plan_entries_meal_plan_id_idx
  on public.meal_plan_entries (meal_plan_id);

-- ---------------------------------------------------------------------------
-- grocery_items (materialized aggregate for a week's plan)
-- ---------------------------------------------------------------------------
create table if not exists public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans (id) on delete cascade,
  name text not null,
  quantity numeric,
  unit text,
  checked boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists grocery_items_meal_plan_id_idx
  on public.grocery_items (meal_plan_id);
