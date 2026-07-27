-- SmartCart Row Level Security policies, security-definer helpers, and the
-- new-user profile trigger.

-- ---------------------------------------------------------------------------
-- New user -> profile trigger
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Security-definer helpers (avoid recursive RLS evaluation)
-- ---------------------------------------------------------------------------

-- Is the current user a member of the given kitchen?
create or replace function public.is_kitchen_member(_kitchen_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.kitchen_members km
    where km.kitchen_id = _kitchen_id
      and km.user_id = auth.uid()
  );
$$;

-- Is the given recipe used in a meal plan belonging to a kitchen the current
-- user is a member of? (Lets kitchen members see each other's recipe titles /
-- ingredients even when the recipe itself is private.)
create or replace function public.recipe_in_my_kitchen(_recipe_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.meal_plan_entries e
    join public.meal_plans mp on mp.id = e.meal_plan_id
    join public.kitchen_members km on km.kitchen_id = mp.kitchen_id
    where e.recipe_id = _recipe_id
      and km.user_id = auth.uid()
  );
$$;

-- Join a kitchen by its invite code (bypasses the kitchens select policy so
-- non-members can look it up). Returns the joined kitchen id.
create or replace function public.join_kitchen_by_code(_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _kitchen_id uuid;
begin
  select id into _kitchen_id
  from public.kitchens
  where invite_code = upper(trim(_invite_code));

  if _kitchen_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.kitchen_members (kitchen_id, user_id, role)
  values (_kitchen_id, auth.uid(), 'member')
  on conflict (kitchen_id, user_id) do nothing;

  return _kitchen_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.recipes            enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.kitchens           enable row level security;
alter table public.kitchen_members    enable row level security;
alter table public.meal_plans         enable row level security;
alter table public.meal_plan_entries  enable row level security;
alter table public.grocery_items      enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_insert_self"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- recipes
-- ---------------------------------------------------------------------------
create policy "recipes_select_visible"
  on public.recipes for select
  to authenticated
  using (
    owner_id = auth.uid()
    or is_public
    or public.recipe_in_my_kitchen(id)
  );

create policy "recipes_insert_own"
  on public.recipes for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "recipes_update_own"
  on public.recipes for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "recipes_delete_own"
  on public.recipes for delete
  to authenticated
  using (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- recipe_ingredients (follow visibility of the parent recipe)
-- ---------------------------------------------------------------------------
create policy "recipe_ingredients_select_visible"
  on public.recipe_ingredients for select
  to authenticated
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id
        and (
          r.owner_id = auth.uid()
          or r.is_public
          or public.recipe_in_my_kitchen(r.id)
        )
    )
  );

create policy "recipe_ingredients_write_own"
  on public.recipe_ingredients for all
  to authenticated
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id and r.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- kitchens
-- ---------------------------------------------------------------------------
create policy "kitchens_select_member"
  on public.kitchens for select
  to authenticated
  using (created_by = auth.uid() or public.is_kitchen_member(id));

create policy "kitchens_insert_own"
  on public.kitchens for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "kitchens_update_creator"
  on public.kitchens for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "kitchens_delete_creator"
  on public.kitchens for delete
  to authenticated
  using (created_by = auth.uid());

-- ---------------------------------------------------------------------------
-- kitchen_members
-- ---------------------------------------------------------------------------
create policy "kitchen_members_select_visible"
  on public.kitchen_members for select
  to authenticated
  using (user_id = auth.uid() or public.is_kitchen_member(kitchen_id));

create policy "kitchen_members_insert_self"
  on public.kitchen_members for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "kitchen_members_delete_self_or_owner"
  on public.kitchen_members for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.kitchens k
      where k.id = kitchen_id and k.created_by = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- meal_plans
-- ---------------------------------------------------------------------------
create policy "meal_plans_select_member"
  on public.meal_plans for select
  to authenticated
  using (public.is_kitchen_member(kitchen_id));

create policy "meal_plans_insert_member"
  on public.meal_plans for insert
  to authenticated
  with check (public.is_kitchen_member(kitchen_id));

create policy "meal_plans_update_member"
  on public.meal_plans for update
  to authenticated
  using (public.is_kitchen_member(kitchen_id))
  with check (public.is_kitchen_member(kitchen_id));

create policy "meal_plans_delete_member"
  on public.meal_plans for delete
  to authenticated
  using (public.is_kitchen_member(kitchen_id));

-- ---------------------------------------------------------------------------
-- meal_plan_entries
-- ---------------------------------------------------------------------------
create policy "meal_plan_entries_select_member"
  on public.meal_plan_entries for select
  to authenticated
  using (
    exists (
      select 1 from public.meal_plans mp
      where mp.id = meal_plan_id and public.is_kitchen_member(mp.kitchen_id)
    )
  );

create policy "meal_plan_entries_insert_member"
  on public.meal_plan_entries for insert
  to authenticated
  with check (
    exists (
      select 1 from public.meal_plans mp
      where mp.id = meal_plan_id and public.is_kitchen_member(mp.kitchen_id)
    )
    and exists (
      select 1 from public.recipes r
      where r.id = recipe_id
        and (r.owner_id = auth.uid() or r.is_public)
    )
  );

create policy "meal_plan_entries_delete_member"
  on public.meal_plan_entries for delete
  to authenticated
  using (
    exists (
      select 1 from public.meal_plans mp
      where mp.id = meal_plan_id and public.is_kitchen_member(mp.kitchen_id)
    )
  );

-- ---------------------------------------------------------------------------
-- grocery_items
-- ---------------------------------------------------------------------------
create policy "grocery_items_select_member"
  on public.grocery_items for select
  to authenticated
  using (
    exists (
      select 1 from public.meal_plans mp
      where mp.id = meal_plan_id and public.is_kitchen_member(mp.kitchen_id)
    )
  );

create policy "grocery_items_write_member"
  on public.grocery_items for all
  to authenticated
  using (
    exists (
      select 1 from public.meal_plans mp
      where mp.id = meal_plan_id and public.is_kitchen_member(mp.kitchen_id)
    )
  )
  with check (
    exists (
      select 1 from public.meal_plans mp
      where mp.id = meal_plan_id and public.is_kitchen_member(mp.kitchen_id)
    )
  );
