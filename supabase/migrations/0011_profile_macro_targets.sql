-- Daily macro nutrition targets on member profiles (optional).

alter table public.profiles
  add column if not exists target_calories numeric
    check (target_calories is null or (target_calories > 0 and target_calories <= 20000)),
  add column if not exists target_protein_g numeric
    check (target_protein_g is null or (target_protein_g >= 0 and target_protein_g <= 1000)),
  add column if not exists target_carbs_g numeric
    check (target_carbs_g is null or (target_carbs_g >= 0 and target_carbs_g <= 2000)),
  add column if not exists target_fat_g numeric
    check (target_fat_g is null or (target_fat_g >= 0 and target_fat_g <= 1000)),
  add column if not exists target_fiber_g numeric
    check (target_fiber_g is null or (target_fiber_g >= 0 and target_fiber_g <= 200));
