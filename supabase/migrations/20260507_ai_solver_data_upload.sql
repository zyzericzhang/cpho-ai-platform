-- AI Solver upload, extraction placeholder, and confirmation gate foundation.
-- Apply after the auth/profiles migration is present.

create extension if not exists "pgcrypto";

do $$
begin
  create type public.ai_solver_session_status as enum ('draft', 'extraction_placeholder', 'confirmed', 'analysis_ready');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.ai_solver_material_role as enum ('problem', 'answer', 'combined');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.ai_solver_material_kind as enum ('image', 'pdf', 'docx');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.ai_solver_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled AI Solver session',
  status public.ai_solver_session_status not null default 'draft',
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.uploaded_materials (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ai_solver_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.ai_solver_material_role not null,
  kind public.ai_solver_material_kind not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  storage_bucket text not null default 'ai-solver-uploads',
  storage_path text not null,
  created_at timestamptz not null default now(),
  constraint uploaded_materials_owner_path check (storage_path like user_id::text || '/%')
);

create table if not exists public.extracted_materials (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ai_solver_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_text text not null default '',
  diagram_notes text not null default '',
  standard_answer text not null default '',
  extraction_status text not null default 'not_connected' check (extraction_status = 'not_connected'),
  is_standard_answer_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id),
  constraint extracted_materials_confirmed_answer_required
    check (not is_standard_answer_confirmed or length(btrim(standard_answer)) > 0)
);

create table if not exists public.ai_solution_outputs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ai_solver_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'openrouter',
  model text not null default 'google/gemini-3.1-pro-preview',
  sections jsonb not null default '{}'::jsonb,
  retrieval_status jsonb not null default '{"similar_problems":"not_connected","related_articles":"not_connected"}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_solver_sessions_user_id_created_at_idx
  on public.ai_solver_sessions (user_id, created_at desc);

create index if not exists uploaded_materials_user_session_idx
  on public.uploaded_materials (user_id, session_id);

create index if not exists extracted_materials_user_session_idx
  on public.extracted_materials (user_id, session_id);

create index if not exists ai_solution_outputs_user_session_idx
  on public.ai_solution_outputs (user_id, session_id);

alter table public.ai_solver_sessions enable row level security;
alter table public.uploaded_materials enable row level security;
alter table public.extracted_materials enable row level security;
alter table public.ai_solution_outputs enable row level security;

create policy "Users can read own AI Solver sessions"
  on public.ai_solver_sessions for select
  using (user_id = auth.uid());

create policy "Users can create own AI Solver sessions"
  on public.ai_solver_sessions for insert
  with check (user_id = auth.uid());

create policy "Users can update own AI Solver sessions"
  on public.ai_solver_sessions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own AI Solver sessions"
  on public.ai_solver_sessions for delete
  using (user_id = auth.uid());

create policy "Users can read own uploaded materials"
  on public.uploaded_materials for select
  using (user_id = auth.uid());

create policy "Users can create own uploaded materials"
  on public.uploaded_materials for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.ai_solver_sessions s
      where s.id = session_id
        and s.user_id = auth.uid()
    )
  );

create policy "Users can delete own uploaded materials"
  on public.uploaded_materials for delete
  using (user_id = auth.uid());

create policy "Users can read own extracted materials"
  on public.extracted_materials for select
  using (user_id = auth.uid());

create policy "Users can create own extracted materials"
  on public.extracted_materials for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.ai_solver_sessions s
      where s.id = session_id
        and s.user_id = auth.uid()
    )
  );

create policy "Users can update own extracted materials"
  on public.extracted_materials for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can read own AI solution outputs"
  on public.ai_solution_outputs for select
  using (user_id = auth.uid());

create policy "Users can create own AI solution outputs"
  on public.ai_solution_outputs for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.ai_solver_sessions s
      join public.extracted_materials e on e.session_id = s.id
      where s.id = session_id
        and s.user_id = auth.uid()
        and e.user_id = auth.uid()
        and e.is_standard_answer_confirmed
        and length(btrim(e.standard_answer)) > 0
    )
  );

insert into storage.buckets (id, name, public)
values ('ai-solver-uploads', 'ai-solver-uploads', false)
on conflict (id) do nothing;

create policy "Users can read own AI Solver upload objects"
  on storage.objects for select
  using (
    bucket_id = 'ai-solver-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can upload own AI Solver objects"
  on storage.objects for insert
  with check (
    bucket_id = 'ai-solver-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own AI Solver upload objects"
  on storage.objects for delete
  using (
    bucket_id = 'ai-solver-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
