-- Ratings and comments on shared (public) cookbook recipes.

create table if not exists public.recipe_ratings (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (recipe_id, user_id)
);

create index if not exists recipe_ratings_recipe_id_idx
  on public.recipe_ratings (recipe_id);

create table if not exists public.recipe_comments (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists recipe_comments_recipe_id_created_at_idx
  on public.recipe_comments (recipe_id, created_at desc);

-- Helper: is this recipe currently shared to the cookbook?
create or replace function public.recipe_is_public(_recipe_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.recipes r
    where r.id = _recipe_id
      and r.is_public = true
  );
$$;

alter table public.recipe_ratings enable row level security;
alter table public.recipe_comments enable row level security;

-- Anyone authenticated can read ratings/comments on public recipes
-- (and on recipes they can already see via ownership / kitchen).
create policy "recipe_ratings_select_visible"
  on public.recipe_ratings for select
  to authenticated
  using (
    public.recipe_is_public(recipe_id)
    or exists (
      select 1 from public.recipes r
      where r.id = recipe_id
        and (
          r.owner_id = auth.uid()
          or public.recipe_in_my_kitchen(r.id)
        )
    )
  );

create policy "recipe_ratings_insert_public"
  on public.recipe_ratings for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.recipe_is_public(recipe_id)
  );

create policy "recipe_ratings_update_own"
  on public.recipe_ratings for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.recipe_is_public(recipe_id)
  );

create policy "recipe_ratings_delete_own"
  on public.recipe_ratings for delete
  to authenticated
  using (user_id = auth.uid());

create policy "recipe_comments_select_visible"
  on public.recipe_comments for select
  to authenticated
  using (
    public.recipe_is_public(recipe_id)
    or exists (
      select 1 from public.recipes r
      where r.id = recipe_id
        and (
          r.owner_id = auth.uid()
          or public.recipe_in_my_kitchen(r.id)
        )
    )
  );

create policy "recipe_comments_insert_public"
  on public.recipe_comments for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.recipe_is_public(recipe_id)
    and char_length(trim(body)) between 1 and 2000
  );

create policy "recipe_comments_delete_own"
  on public.recipe_comments for delete
  to authenticated
  using (user_id = auth.uid());
