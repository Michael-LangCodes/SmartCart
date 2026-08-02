-- Shared kitchen pantry inventory for recipe matching.

create table if not exists public.kitchen_pantry_items (
  id uuid primary key default gen_random_uuid(),
  kitchen_id uuid not null references public.kitchens (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  quantity numeric check (quantity is null or quantity >= 0),
  unit text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists kitchen_pantry_items_kitchen_name_uidx
  on public.kitchen_pantry_items (kitchen_id, lower(trim(name)));

create index if not exists kitchen_pantry_items_kitchen_id_idx
  on public.kitchen_pantry_items (kitchen_id);

alter table public.kitchen_pantry_items enable row level security;

create policy "kitchen_pantry_select_member"
  on public.kitchen_pantry_items for select
  to authenticated
  using (public.is_kitchen_member(kitchen_id));

create policy "kitchen_pantry_insert_member"
  on public.kitchen_pantry_items for insert
  to authenticated
  with check (public.is_kitchen_member(kitchen_id));

create policy "kitchen_pantry_update_member"
  on public.kitchen_pantry_items for update
  to authenticated
  using (public.is_kitchen_member(kitchen_id))
  with check (public.is_kitchen_member(kitchen_id));

create policy "kitchen_pantry_delete_member"
  on public.kitchen_pantry_items for delete
  to authenticated
  using (public.is_kitchen_member(kitchen_id));
