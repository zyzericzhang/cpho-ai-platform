create or replace function private.prevent_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and not private.is_admin() then
    raise exception 'Changing profile role is not allowed.';
  end if;

  return new;
end;
$$;

grant execute on function private.prevent_profile_role_change() to anon, authenticated;

drop trigger if exists prevent_profile_role_change on public.profiles;
create trigger prevent_profile_role_change
  before update on public.profiles
  for each row execute procedure private.prevent_profile_role_change();

grant insert, select, update on table public.profiles to supabase_auth_admin;

drop policy if exists "Users can insert their own profile." on public.profiles;
create policy "Users can insert their own student profile"
  on public.profiles for insert
  with check (
    auth.uid() = id
    and role = 'student'
  );

drop policy if exists "Users can update own non-role profile fields" on public.profiles;
create policy "Users can update own non-role profile fields"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Published problems are viewable by authenticated users" on public.problems;
create policy "Published problems are viewable by authenticated users"
  on public.problems for select
  using (
    private.is_admin()
    or (
      auth.role() = 'authenticated'
      and status = 'published'
    )
  );

drop policy if exists "Papers for published problems are viewable by authenticated users" on public.papers;
create policy "Papers for published problems are viewable by authenticated users"
  on public.papers for select
  using (
    private.is_admin()
    or (
      auth.role() = 'authenticated'
      and exists (
        select 1
        from public.problems pr
        where pr.paper_id = papers.id
          and pr.status = 'published'
      )
    )
  );

drop policy if exists "Published paper PDFs are viewable by authenticated users" on storage.objects;
create policy "Published paper PDFs are viewable by authenticated users"
  on storage.objects for select
  using (
    bucket_id = 'problem-bank-papers'
    and (
      private.is_admin()
      or (
        auth.role() = 'authenticated'
        and exists (
          select 1
          from public.papers p
          join public.problems pr on pr.paper_id = p.id
          where (
              p.source_pdf_storage_path = storage.objects.name
              or p.answer_pdf_storage_path = storage.objects.name
            )
            and pr.status = 'published'
        )
      )
    )
  );
