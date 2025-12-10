-- Progreso de lecciones por inscripcion
create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (enrollment_id, lesson_id)
);

create index if not exists lesson_progress_enrollment_id_idx on public.lesson_progress (enrollment_id);
create index if not exists lesson_progress_lesson_id_idx on public.lesson_progress (lesson_id);

alter table public.lesson_progress enable row level security;

create policy "Students can view their lesson progress"
  on public.lesson_progress
  for select
  using (
    exists (
      select 1 from public.enrollments e
      where e.id = enrollment_id
        and e.student_id = auth.uid()
    )
    or is_admin(auth.uid())
  );

create policy "Students can insert their lesson progress"
  on public.lesson_progress
  for insert
  with check (
    exists (
      select 1 from public.enrollments e
      where e.id = enrollment_id
        and e.student_id = auth.uid()
        and e.status = 'active'
    )
    or is_admin(auth.uid())
  );
