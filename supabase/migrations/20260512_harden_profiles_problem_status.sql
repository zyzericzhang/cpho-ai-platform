-- Harden profile role updates and align Problem Bank public reads with the permission matrix.
-- Apply after the auth/profiles and Problem Bank migrations.

alter table public.profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone." on public.profiles;

create policy "Users can read own profile and admins can read profiles"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Users can update own profile." on public.profiles;

create policy "Users can update own non-role profile fields"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (
      select p.role
      from public.profiles p
      where p.id = auth.uid()
    )
  );

alter table public.problems
  add column if not exists status text not null default 'published';

alter table public.problems
  drop constraint if exists problems_status_check;

alter table public.problems
  add constraint problems_status_check
  check (status in ('draft', 'published', 'archived'));

update public.problems
set status = 'published'
where status is null;

drop policy if exists "Problems are public and viewable by everyone" on public.problems;

create policy "Published problems are viewable by authenticated users"
  on public.problems for select
  using (status = 'published' or public.is_admin());

drop policy if exists "Papers are public and viewable by everyone" on public.papers;

create policy "Papers for published problems are viewable by authenticated users"
  on public.papers for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.problems pr
      where pr.paper_id = papers.id
        and pr.status = 'published'
    )
  );

update storage.buckets
set public = false
where id = 'problem-bank-papers';

drop policy if exists "Paper PDFs are public and viewable by everyone" on storage.objects;
drop policy if exists "Admins can view paper PDFs" on storage.objects;

create policy "Published paper PDFs are viewable by authenticated users"
  on storage.objects for select
  using (
    bucket_id = 'problem-bank-papers'
    and (
      public.is_admin()
      or exists (
        select 1
        from public.papers p
        join public.problems pr on pr.paper_id = p.id
        where p.source_pdf_storage_path = storage.objects.name
          and pr.status = 'published'
      )
    )
  );

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.ai_solver_sessions to authenticated;
grant select, insert, update, delete on table public.uploaded_materials to authenticated;
grant select, insert, update, delete on table public.extracted_materials to authenticated;
grant select, insert on table public.ai_solution_outputs to authenticated;
grant select, insert, update, delete on table public.papers to authenticated;
grant select, insert, update, delete on table public.problems to authenticated;
grant select, insert, update, delete on table public.personal_library_items to authenticated;
