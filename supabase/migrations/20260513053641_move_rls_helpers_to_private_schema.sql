create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to anon, authenticated;
grant usage on schema private to supabase_auth_admin;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, role)
  values (new.id, new.raw_user_meta_data->>'username', 'student');
  return new;
end;
$$;

create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.handle_new_user() to supabase_auth_admin;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure private.handle_new_user();

drop policy if exists "Users can read own profile and admins can read profiles" on public.profiles;
create policy "Users can read own profile and admins can read profiles"
  on public.profiles for select
  using (auth.uid() = id or private.is_admin());

drop policy if exists "Published problems are viewable by authenticated users" on public.problems;
create policy "Published problems are viewable by authenticated users"
  on public.problems for select
  using (status = 'published' or private.is_admin());

drop policy if exists "Papers for published problems are viewable by authenticated users" on public.papers;
create policy "Papers for published problems are viewable by authenticated users"
  on public.papers for select
  using (
    private.is_admin()
    or exists (
      select 1
      from public.problems pr
      where pr.paper_id = papers.id
        and pr.status = 'published'
    )
  );

drop policy if exists "Admins can create papers" on public.papers;
create policy "Admins can create papers"
  on public.papers for insert
  with check (private.is_admin());

drop policy if exists "Admins can update papers" on public.papers;
create policy "Admins can update papers"
  on public.papers for update
  using (private.is_admin())
  with check (private.is_admin());

drop policy if exists "Admins can delete papers" on public.papers;
create policy "Admins can delete papers"
  on public.papers for delete
  using (private.is_admin());

drop policy if exists "Admins can create problems" on public.problems;
create policy "Admins can create problems"
  on public.problems for insert
  with check (private.is_admin());

drop policy if exists "Admins can update problems" on public.problems;
create policy "Admins can update problems"
  on public.problems for update
  using (private.is_admin())
  with check (private.is_admin());

drop policy if exists "Admins can delete problems" on public.problems;
create policy "Admins can delete problems"
  on public.problems for delete
  using (private.is_admin());

drop policy if exists "Published paper PDFs are viewable by authenticated users" on storage.objects;
create policy "Published paper PDFs are viewable by authenticated users"
  on storage.objects for select
  using (
    bucket_id = 'problem-bank-papers'
    and (
      private.is_admin()
      or exists (
        select 1
        from public.papers p
        join public.problems pr on pr.paper_id = p.id
        where p.source_pdf_storage_path = storage.objects.name
          and pr.status = 'published'
      )
    )
  );

drop policy if exists "Admins can upload paper PDFs" on storage.objects;
create policy "Admins can upload paper PDFs"
  on storage.objects for insert
  with check (
    bucket_id = 'problem-bank-papers'
    and private.is_admin()
  );

drop policy if exists "Admins can update paper PDFs" on storage.objects;
create policy "Admins can update paper PDFs"
  on storage.objects for update
  using (
    bucket_id = 'problem-bank-papers'
    and private.is_admin()
  );

drop policy if exists "Admins can delete paper PDFs" on storage.objects;
create policy "Admins can delete paper PDFs"
  on storage.objects for delete
  using (
    bucket_id = 'problem-bank-papers'
    and private.is_admin()
  );

drop function if exists public.is_admin();
drop function if exists public.handle_new_user();
