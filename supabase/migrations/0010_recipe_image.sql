-- Optional cover image URL for recipes (used especially in the cookbook).

alter table public.recipes
  add column if not exists image_url text
    check (
      image_url is null
      or (
        char_length(trim(image_url)) between 1 and 2000
        and (
          image_url ~* '^https?://'
        )
      )
    );
