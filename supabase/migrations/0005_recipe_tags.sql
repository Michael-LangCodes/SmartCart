-- Recipe tags (healthy, high protein, etc.) stored as a text array.

alter table public.recipes
  add column if not exists tags text[] not null default '{}';

create index if not exists recipes_tags_gin_idx
  on public.recipes using gin (tags);
