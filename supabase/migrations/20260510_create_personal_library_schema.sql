-- Create an enum type for different item types in the personal library
do $$
begin
  create type public.personal_library_item_type as enum ('problem', 'article', 'problem_set');
exception
  when duplicate_object then null;
end $$;

-- Create the table to store items in a user's personal library
create table if not exists public.personal_library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null,
  item_type public.personal_library_item_type not null,
  created_at timestamptz not null default now(),
  
  -- Prevent duplicate entries for the same item by the same user
  constraint unique_user_item unique (user_id, item_id, item_type)
);

-- Enable RLS
alter table public.personal_library_items enable row level security;

-- Policies for 'personal_library_items' table
create policy "Users can manage their own library items"
  on public.personal_library_items for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Add indexes for performance
create index if not exists personal_library_user_id_idx on public.personal_library_items (user_id);
create index if not exists personal_library_item_id_idx on public.personal_library_items (item_id);
