-- Sample public cookbook recipes for SmartCart.
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
-- Safe to re-run: uses fixed IDs and upserts.

-- ---------------------------------------------------------------------------
-- 1. System "Cookbook" owner (anonymous-looking account that owns the samples)
-- ---------------------------------------------------------------------------
do $$
declare
  cookbook_user_id uuid := 'a0000000-0000-4000-8000-000000000001';
begin
  if not exists (select 1 from auth.users where id = cookbook_user_id) then
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      is_anonymous,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      cookbook_user_id,
      'authenticated',
      'authenticated',
      'cookbook@smartcart.app',
      crypt('seed-only-not-for-login', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"SmartCart Cookbook"}'::jsonb,
      now(),
      now(),
      false,
      '',
      '',
      '',
      ''
    );
  end if;

  insert into public.profiles (id, display_name)
  values (cookbook_user_id, 'SmartCart Cookbook')
  on conflict (id) do update set display_name = excluded.display_name;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Sample recipes (public)
-- ---------------------------------------------------------------------------
insert into public.recipes (
  id, owner_id, title, description, instructions, servings,
  difficulty, prep_minutes, cook_minutes, tags, origin, is_public,
  calories, protein_g, carbs_g, fat_g, fiber_g
) values
(
  'b0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'Spaghetti Bolognese',
  'A hearty meat sauce over pasta — weeknight classic.',
  E'1. Heat olive oil in a large pan; sauté onion, carrot, and garlic until soft.\n2. Add ground beef and cook until browned.\n3. Stir in tomato paste, crushed tomatoes, salt, and pepper. Simmer 20–30 minutes.\n4. Boil spaghetti until al dente. Drain and toss with sauce.\n5. Serve with grated Parmesan.',
  4,
  'medium', 15, 35,
  array['comfort food', 'high protein'],
  'cookbook',
  true,
  520, 32, 58, 16, 5
),
(
  'b0000000-0000-4000-8000-000000000002',
  'a0000000-0000-4000-8000-000000000001',
  'Chicken Stir-Fry',
  'Quick skillet dinner with crisp vegetables and soy-ginger sauce.',
  E'1. Slice chicken into thin strips; toss with a pinch of salt.\n2. Whisk soy sauce, ginger, garlic, and a splash of oil for the sauce.\n3. Stir-fry chicken in a hot pan until cooked through; set aside.\n4. Stir-fry broccoli, bell pepper, and snap peas until tender-crisp.\n5. Return chicken, pour in sauce, and toss 1–2 minutes. Serve over rice.',
  4,
  'easy', 15, 15,
  array['quick', 'high protein', 'healthy'],
  'cookbook',
  true,
  380, 34, 28, 12, 4
),
(
  'b0000000-0000-4000-8000-000000000003',
  'a0000000-0000-4000-8000-000000000001',
  'Overnight Oats',
  'Make-ahead breakfast — no cooking required.',
  E'1. Combine oats, milk, yogurt, chia seeds, and maple syrup in a jar.\n2. Stir well, cover, and refrigerate overnight (at least 6 hours).\n3. In the morning, top with berries and a spoonful of peanut butter.\n4. Eat cold or warm gently in the microwave.',
  2,
  'easy', 5, 0,
  array['meal prep', 'healthy', 'vegetarian'],
  'cookbook',
  true,
  340, 14, 48, 10, 8
),
(
  'b0000000-0000-4000-8000-000000000004',
  'a0000000-0000-4000-8000-000000000001',
  'Caprese Salad',
  'Fresh tomatoes, mozzarella, and basil with a balsamic drizzle.',
  E'1. Slice tomatoes and mozzarella into rounds.\n2. Arrange alternating slices on a platter with basil leaves.\n3. Drizzle with olive oil and balsamic vinegar.\n4. Season with salt and freshly cracked pepper. Serve immediately.',
  4,
  'easy', 10, 0,
  array['quick', 'vegetarian', 'healthy'],
  'cookbook',
  true,
  220, 12, 8, 16, 2
),
(
  'b0000000-0000-4000-8000-000000000005',
  'a0000000-0000-4000-8000-000000000001',
  'Sheet-Pan Salmon',
  'Salmon and vegetables roasted together for an easy clean-up dinner.',
  E'1. Preheat oven to 400°F (200°C).\n2. Toss broccoli and potatoes with olive oil, salt, and pepper; spread on a sheet pan.\n3. Roast 15 minutes, then push veggies aside and add salmon fillets.\n4. Season salmon with lemon, garlic, salt, and pepper.\n5. Roast another 12–15 minutes until salmon flakes easily. Serve with lemon wedges.',
  4,
  'easy', 10, 30,
  array['healthy', 'high protein', 'meal prep'],
  'cookbook',
  true,
  450, 36, 32, 18, 5
),
(
  'b0000000-0000-4000-8000-000000000006',
  'a0000000-0000-4000-8000-000000000001',
  'Black Bean Tacos',
  'Vegetarian tacos ready in about 20 minutes.',
  E'1. Warm black beans with cumin, chili powder, garlic, and a splash of water.\n2. Warm tortillas in a dry skillet.\n3. Fill tortillas with beans, shredded lettuce, salsa, and cheese.\n4. Finish with a squeeze of lime and cilantro if you have it.',
  4,
  'easy', 10, 10,
  array['vegetarian', 'budget', 'quick', 'kid-friendly'],
  'cookbook',
  true,
  360, 16, 48, 12, 12
),
(
  'b0000000-0000-4000-8000-000000000007',
  'a0000000-0000-4000-8000-000000000001',
  'Vegetable Soup',
  'Comforting one-pot soup that freezes well.',
  E'1. Sauté onion, celery, and carrot in olive oil until softened.\n2. Add garlic, then broth, diced tomatoes, and bay leaf.\n3. Stir in potatoes, green beans, and zucchini; simmer until tender (about 20 minutes).\n4. Season with salt, pepper, and herbs. Remove bay leaf and serve.',
  6,
  'easy', 15, 30,
  array['vegan', 'healthy', 'budget', 'meal prep'],
  'cookbook',
  true,
  180, 6, 28, 5, 6
),
(
  'b0000000-0000-4000-8000-000000000008',
  'a0000000-0000-4000-8000-000000000001',
  'Banana Pancakes',
  'Fluffy pancakes sweetened with ripe banana.',
  E'1. Mash bananas in a bowl; whisk in eggs, milk, and melted butter.\n2. Stir in flour, baking powder, and a pinch of salt until just combined.\n3. Cook scoopfuls on a buttered griddle over medium heat until bubbles form; flip.\n4. Serve with maple syrup and fresh fruit.',
  4,
  'easy', 10, 15,
  array['kid-friendly', 'vegetarian', 'comfort food'],
  'cookbook',
  true,
  310, 9, 48, 10, 3
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  instructions = excluded.instructions,
  servings = excluded.servings,
  difficulty = excluded.difficulty,
  prep_minutes = excluded.prep_minutes,
  cook_minutes = excluded.cook_minutes,
  tags = excluded.tags,
  origin = excluded.origin,
  calories = excluded.calories,
  protein_g = excluded.protein_g,
  carbs_g = excluded.carbs_g,
  fat_g = excluded.fat_g,
  fiber_g = excluded.fiber_g,
  is_public = true,
  owner_id = excluded.owner_id;

-- ---------------------------------------------------------------------------
-- 3. Ingredients (replace set per recipe so re-runs stay clean)
-- ---------------------------------------------------------------------------
delete from public.recipe_ingredients
where recipe_id in (
  'b0000000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000002',
  'b0000000-0000-4000-8000-000000000003',
  'b0000000-0000-4000-8000-000000000004',
  'b0000000-0000-4000-8000-000000000005',
  'b0000000-0000-4000-8000-000000000006',
  'b0000000-0000-4000-8000-000000000007',
  'b0000000-0000-4000-8000-000000000008'
);

insert into public.recipe_ingredients (recipe_id, name, quantity, unit, position) values
-- Spaghetti Bolognese
('b0000000-0000-4000-8000-000000000001', 'Spaghetti', 12, 'oz', 0),
('b0000000-0000-4000-8000-000000000001', 'Ground beef', 1, 'lb', 1),
('b0000000-0000-4000-8000-000000000001', 'Onion', 1, null, 2),
('b0000000-0000-4000-8000-000000000001', 'Carrot', 1, null, 3),
('b0000000-0000-4000-8000-000000000001', 'Garlic cloves', 3, null, 4),
('b0000000-0000-4000-8000-000000000001', 'Crushed tomatoes', 28, 'oz', 5),
('b0000000-0000-4000-8000-000000000001', 'Tomato paste', 2, 'tbsp', 6),
('b0000000-0000-4000-8000-000000000001', 'Olive oil', 2, 'tbsp', 7),
('b0000000-0000-4000-8000-000000000001', 'Parmesan cheese', 0.5, 'cup', 8),

-- Chicken Stir-Fry
('b0000000-0000-4000-8000-000000000002', 'Chicken breast', 1.5, 'lb', 0),
('b0000000-0000-4000-8000-000000000002', 'Broccoli florets', 3, 'cups', 1),
('b0000000-0000-4000-8000-000000000002', 'Bell pepper', 1, null, 2),
('b0000000-0000-4000-8000-000000000002', 'Snap peas', 1, 'cup', 3),
('b0000000-0000-4000-8000-000000000002', 'Soy sauce', 3, 'tbsp', 4),
('b0000000-0000-4000-8000-000000000002', 'Fresh ginger', 1, 'tbsp', 5),
('b0000000-0000-4000-8000-000000000002', 'Garlic cloves', 2, null, 6),
('b0000000-0000-4000-8000-000000000002', 'Cooked rice', 3, 'cups', 7),
('b0000000-0000-4000-8000-000000000002', 'Vegetable oil', 2, 'tbsp', 8),

-- Overnight Oats
('b0000000-0000-4000-8000-000000000003', 'Rolled oats', 1, 'cup', 0),
('b0000000-0000-4000-8000-000000000003', 'Milk', 1, 'cup', 1),
('b0000000-0000-4000-8000-000000000003', 'Greek yogurt', 0.5, 'cup', 2),
('b0000000-0000-4000-8000-000000000003', 'Chia seeds', 2, 'tbsp', 3),
('b0000000-0000-4000-8000-000000000003', 'Maple syrup', 2, 'tbsp', 4),
('b0000000-0000-4000-8000-000000000003', 'Berries', 1, 'cup', 5),
('b0000000-0000-4000-8000-000000000003', 'Peanut butter', 2, 'tbsp', 6),

-- Caprese Salad
('b0000000-0000-4000-8000-000000000004', 'Tomatoes', 3, null, 0),
('b0000000-0000-4000-8000-000000000004', 'Fresh mozzarella', 8, 'oz', 1),
('b0000000-0000-4000-8000-000000000004', 'Fresh basil', 1, 'bunch', 2),
('b0000000-0000-4000-8000-000000000004', 'Olive oil', 2, 'tbsp', 3),
('b0000000-0000-4000-8000-000000000004', 'Balsamic vinegar', 1, 'tbsp', 4),

-- Sheet-Pan Salmon
('b0000000-0000-4000-8000-000000000005', 'Salmon fillets', 4, null, 0),
('b0000000-0000-4000-8000-000000000005', 'Broccoli florets', 4, 'cups', 1),
('b0000000-0000-4000-8000-000000000005', 'Baby potatoes', 1.5, 'lb', 2),
('b0000000-0000-4000-8000-000000000005', 'Olive oil', 3, 'tbsp', 3),
('b0000000-0000-4000-8000-000000000005', 'Lemon', 1, null, 4),
('b0000000-0000-4000-8000-000000000005', 'Garlic cloves', 3, null, 5),

-- Black Bean Tacos
('b0000000-0000-4000-8000-000000000006', 'Black beans', 2, 'cans', 0),
('b0000000-0000-4000-8000-000000000006', 'Corn tortillas', 8, null, 1),
('b0000000-0000-4000-8000-000000000006', 'Shredded lettuce', 2, 'cups', 2),
('b0000000-0000-4000-8000-000000000006', 'Salsa', 1, 'cup', 3),
('b0000000-0000-4000-8000-000000000006', 'Shredded cheese', 1, 'cup', 4),
('b0000000-0000-4000-8000-000000000006', 'Lime', 1, null, 5),
('b0000000-0000-4000-8000-000000000006', 'Cumin', 1, 'tsp', 6),
('b0000000-0000-4000-8000-000000000006', 'Chili powder', 1, 'tsp', 7),
('b0000000-0000-4000-8000-000000000006', 'Garlic cloves', 2, null, 8),

-- Vegetable Soup
('b0000000-0000-4000-8000-000000000007', 'Onion', 1, null, 0),
('b0000000-0000-4000-8000-000000000007', 'Celery stalks', 2, null, 1),
('b0000000-0000-4000-8000-000000000007', 'Carrots', 2, null, 2),
('b0000000-0000-4000-8000-000000000007', 'Garlic cloves', 3, null, 3),
('b0000000-0000-4000-8000-000000000007', 'Vegetable broth', 6, 'cups', 4),
('b0000000-0000-4000-8000-000000000007', 'Diced tomatoes', 14, 'oz', 5),
('b0000000-0000-4000-8000-000000000007', 'Potatoes', 2, null, 6),
('b0000000-0000-4000-8000-000000000007', 'Green beans', 1, 'cup', 7),
('b0000000-0000-4000-8000-000000000007', 'Zucchini', 1, null, 8),
('b0000000-0000-4000-8000-000000000007', 'Olive oil', 2, 'tbsp', 9),
('b0000000-0000-4000-8000-000000000007', 'Bay leaf', 1, null, 10),

-- Banana Pancakes
('b0000000-0000-4000-8000-000000000008', 'Ripe bananas', 2, null, 0),
('b0000000-0000-4000-8000-000000000008', 'Eggs', 2, null, 1),
('b0000000-0000-4000-8000-000000000008', 'Milk', 0.75, 'cup', 2),
('b0000000-0000-4000-8000-000000000008', 'All-purpose flour', 1, 'cup', 3),
('b0000000-0000-4000-8000-000000000008', 'Baking powder', 2, 'tsp', 4),
('b0000000-0000-4000-8000-000000000008', 'Butter', 2, 'tbsp', 5),
('b0000000-0000-4000-8000-000000000008', 'Maple syrup', 0.25, 'cup', 6);
