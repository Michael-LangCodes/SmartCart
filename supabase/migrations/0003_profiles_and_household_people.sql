-- Profile preferences, favorite meals, and household non-members (people
-- without accounts who still have diet prefs for planning).

-- ---------------------------------------------------------------------------
-- profiles: allergies, diet, serving multiplier
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists allergies text[] not null default '{}',
  add column if not exists diet_type text not null default 'all'
    check (diet_type in (
      'all', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher', 'other'
    )),
  add column if not exists serving_multiplier numeric not null default 1
    check (serving_multiplier > 0 and serving_multiplier <= 10);

-- ---------------------------------------------------------------------------
-- Logged-in users' top 3 favorite recipes
-- ---------------------------------------------------------------------------
create table if not exists public.profile_favorite_recipes (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  position int not null check (position between 1 and 3),
  created_at timestamptz not null default now(),
  primary key (profile_id, position),
  unique (profile_id, recipe_id)
);
create index if not exists profile_favorite_recipes_recipe_id_idx
  on public.profile_favorite_recipes (recipe_id);

-- ---------------------------------------------------------------------------
-- Non-account household people (kids, guests, etc.)
-- ---------------------------------------------------------------------------
create table if not exists public.kitchen_people (
  id uuid primary key default gen_random_uuid(),
  kitchen_id uuid not null references public.kitchens (id) on delete cascade,
  name text not null,
  allergies text[] not null default '{}',
  diet_type text not null default 'all'
    check (diet_type in (
      'all', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher', 'other'
    )),
  serving_multiplier numeric not null default 1
    check (serving_multiplier > 0 and serving_multiplier <= 10),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists kitchen_people_kitchen_id_idx
  on public.kitchen_people (kitchen_id);

-- ---------------------------------------------------------------------------
-- Non-members' top 3 favorite recipes
-- ---------------------------------------------------------------------------
create table if not exists public.kitchen_person_favorites (
  person_id uuid not null references public.kitchen_people (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  position int not null check (position between 1 and 3),
  created_at timestamptz not null default now(),
  primary key (person_id, position),
  unique (person_id, recipe_id)
);
create index if not exists kitchen_person_favorites_recipe_id_idx
  on public.kitchen_person_favorites (recipe_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profile_favorite_recipes enable row level security;
alter table public.kitchen_people enable row level security;
alter table public.kitchen_person_favorites enable row level security;

-- Favorites: owner manages; kitchen members can read favorites of co-members
-- (so planners can see preferences). Public recipes already visible via recipes RLS.
create policy "profile_favorites_select_self_or_kitchen"
  on public.profile_favorite_recipes for select
  to authenticated
  using (
    profile_id = auth.uid()
    or exists (
      select 1
      from public.kitchen_members me
      join public.kitchen_members them
        on them.kitchen_id = me.kitchen_id
      where me.user_id = auth.uid()
        and them.user_id = profile_id
    )
  );

create policy "profile_favorites_write_self"
  on public.profile_favorite_recipes for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Kitchen people: members of that kitchen
create policy "kitchen_people_select_member"
  on public.kitchen_people for select
  to authenticated
  using (public.is_kitchen_member(kitchen_id));

create policy "kitchen_people_insert_member"
  on public.kitchen_people for insert
  to authenticated
  with check (public.is_kitchen_member(kitchen_id));

create policy "kitchen_people_update_member"
  on public.kitchen_people for update
  to authenticated
  using (public.is_kitchen_member(kitchen_id))
  with check (public.is_kitchen_member(kitchen_id));

create policy "kitchen_people_delete_member"
  on public.kitchen_people for delete
  to authenticated
  using (public.is_kitchen_member(kitchen_id));

-- Person favorites: same kitchen membership as the person
create policy "kitchen_person_favorites_select_member"
  on public.kitchen_person_favorites for select
  to authenticated
  using (
    exists (
      select 1 from public.kitchen_people kp
      where kp.id = person_id and public.is_kitchen_member(kp.kitchen_id)
    )
  );

create policy "kitchen_person_favorites_write_member"
  on public.kitchen_person_favorites for all
  to authenticated
  using (
    exists (
      select 1 from public.kitchen_people kp
      where kp.id = person_id and public.is_kitchen_member(kp.kitchen_id)
    )
  )
  with check (
    exists (
      select 1 from public.kitchen_people kp
      where kp.id = person_id and public.is_kitchen_member(kp.kitchen_id)
    )
  );
