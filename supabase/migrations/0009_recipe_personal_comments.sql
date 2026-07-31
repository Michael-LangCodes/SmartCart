-- Personal (private) comments/notes on recipes you own (My Recipes).

create table if not exists public.recipe_personal_comments (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists recipe_personal_comments_recipe_user_idx
  on public.recipe_personal_comments (recipe_id, user_id, created_at desc);

alter table public.recipe_personal_comments enable row level security;

-- Only the author can see their own personal comments, and only on recipes they own.
create policy "recipe_personal_comments_select_own"
  on public.recipe_personal_comments for select
  to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.recipes r
      where r.id = recipe_id
        and r.owner_id = auth.uid()
    )
  );

create policy "recipe_personal_comments_insert_own"
  on public.recipe_personal_comments for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and char_length(trim(body)) between 1 and 2000
    and exists (
      select 1 from public.recipes r
      where r.id = recipe_id
        and r.owner_id = auth.uid()
    )
  );

create policy "recipe_personal_comments_delete_own"
  on public.recipe_personal_comments for delete
  to authenticated
  using (user_id = auth.uid());
