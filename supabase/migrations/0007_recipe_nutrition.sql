-- Estimated nutrition facts for recipes (values are per serving).

alter table public.recipes
  add column if not exists calories numeric
    check (calories is null or calories >= 0),
  add column if not exists protein_g numeric
    check (protein_g is null or protein_g >= 0),
  add column if not exists carbs_g numeric
    check (carbs_g is null or carbs_g >= 0),
  add column if not exists fat_g numeric
    check (fat_g is null or fat_g >= 0),
  add column if not exists fiber_g numeric
    check (fiber_g is null or fiber_g >= 0);
