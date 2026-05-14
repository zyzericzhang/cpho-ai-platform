-- Create a helper function to check for admin role
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

-- Create papers table for the Problem Bank
create table if not exists public.papers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organization text,
  published_at timestamptz,
  source_pdf_storage_path text,
  created_at timestamptz not null default now(),
  uploader_id uuid references auth.users(id) on delete set null,
  constraint papers_title_check check (length(btrim(title)) > 0)
);

-- Create problems table for the Problem Bank
create table if not exists public.problems (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid references public.papers(id) on delete set null,
  title text not null,
  problem_statement text not null,
  standard_answer text not null,
  category text,
  topics text[],
  model_tags text[],
  created_at timestamptz not null default now(),
  uploader_id uuid references auth.users(id) on delete set null,
  constraint problems_title_check check (length(btrim(title)) > 0),
  constraint problems_statement_check check (length(btrim(problem_statement)) > 0),
  constraint problems_answer_check check (length(btrim(standard_answer)) > 0)
);

-- Create storage bucket for paper PDFs
insert into storage.buckets (id, name, public)
values ('problem-bank-papers', 'problem-bank-papers', false)
on conflict (id) do nothing;

-- Enable RLS for the new tables
alter table public.papers enable row level security;
alter table public.problems enable row level security;

-- Policies for 'papers' table
create policy "Papers are public and viewable by everyone"
  on public.papers for select
  using (true);

create policy "Admins can create papers"
  on public.papers for insert
  with check (public.is_admin());

create policy "Admins can update papers"
  on public.papers for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete papers"
  on public.papers for delete
  using (public.is_admin());

-- Policies for 'problems' table
create policy "Problems are public and viewable by everyone"
  on public.problems for select
  using (true);

create policy "Admins can create problems"
  on public.problems for insert
  with check (public.is_admin());

create policy "Admins can update problems"
  on public.problems for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete problems"
  on public.problems for delete
  using (public.is_admin());

-- Policies for 'problem-bank-papers' storage bucket
create policy "Admins can view paper PDFs"
  on storage.objects for select
  using (
    bucket_id = 'problem-bank-papers'
    and public.is_admin()
  );

create policy "Admins can upload paper PDFs"
  on storage.objects for insert
  with check (
    bucket_id = 'problem-bank-papers'
    and public.is_admin()
  );

create policy "Admins can update paper PDFs"
  on storage.objects for update
  using (
    bucket_id = 'problem-bank-papers'
    and public.is_admin()
  );

create policy "Admins can delete paper PDFs"
  on storage.objects for delete
  using (
    bucket_id = 'problem-bank-papers'
    and public.is_admin()
  );

-- Add indexes for performance
create index if not exists papers_published_at_idx on public.papers (published_at desc);
create index if not exists problems_paper_id_idx on public.problems (paper_id);
create index if not exists problems_category_idx on public.problems (category);
create index if not exists problems_topics_idx on public.problems using gin(topics);
create index if not exists problems_model_tags_idx on public.problems using gin(model_tags);
