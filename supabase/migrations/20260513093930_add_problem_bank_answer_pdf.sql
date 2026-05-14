alter table public.papers
  add column if not exists answer_pdf_storage_path text;

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
        where (
            p.source_pdf_storage_path = storage.objects.name
            or p.answer_pdf_storage_path = storage.objects.name
          )
          and pr.status = 'published'
      )
    )
  );
