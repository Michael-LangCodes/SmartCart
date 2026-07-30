-- Distinguish user-created recipes from ones added from the cookbook.

alter table public.recipes
  add column if not exists origin text not null default 'user'
    check (origin in ('user', 'cookbook')),
  add column if not exists source_recipe_id uuid
    references public.recipes (id) on delete set null;

create index if not exists recipes_origin_idx on public.recipes (origin);

-- Existing public sample/system recipes are cookbook-sourced.
update public.recipes
set origin = 'cookbook'
where is_public = true
  and owner_id = 'a0000000-0000-4000-8000-000000000001';
