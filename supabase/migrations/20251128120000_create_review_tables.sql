-- Reputación bidireccional: docentes y estudiantes
create table if not exists public.teacher_reviews (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists teacher_reviews_teacher_id_idx on public.teacher_reviews (teacher_id);
create index if not exists teacher_reviews_student_id_idx on public.teacher_reviews (student_id);

-- Evita duplicados por tarea; y un único registro cuando no hay tarea asociada
create unique index if not exists teacher_reviews_unique_per_task
  on public.teacher_reviews (teacher_id, student_id, task_id)
  where task_id is not null;

create unique index if not exists teacher_reviews_unique_no_task
  on public.teacher_reviews (teacher_id, student_id)
  where task_id is null;

alter table public.teacher_reviews enable row level security;

create policy "Teacher reviews are visible to authenticated users"
  on public.teacher_reviews
  for select
  using (auth.uid() is not null);

create policy "Students can insert their own teacher reviews"
  on public.teacher_reviews
  for insert
  with check (auth.uid() = student_id);

create policy "Students can update their own teacher reviews"
  on public.teacher_reviews
  for update
  using (auth.uid() = student_id);

create policy "Students can delete their own teacher reviews"
  on public.teacher_reviews
  for delete
  using (auth.uid() = student_id);

-- Reseñas sobre estudiantes (emitidas por docentes)
create table if not exists public.student_reviews (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists student_reviews_student_id_idx on public.student_reviews (student_id);
create index if not exists student_reviews_teacher_id_idx on public.student_reviews (teacher_id);

create unique index if not exists student_reviews_unique_per_task
  on public.student_reviews (student_id, teacher_id, task_id)
  where task_id is not null;

create unique index if not exists student_reviews_unique_no_task
  on public.student_reviews (student_id, teacher_id)
  where task_id is null;

alter table public.student_reviews enable row level security;

create policy "Student reviews are visible to authenticated users"
  on public.student_reviews
  for select
  using (auth.uid() is not null);

create policy "Teachers can insert their own student reviews"
  on public.student_reviews
  for insert
  with check (auth.uid() = teacher_id);

create policy "Teachers can update their own student reviews"
  on public.student_reviews
  for update
  using (auth.uid() = teacher_id);

create policy "Teachers can delete their own student reviews"
  on public.student_reviews
  for delete
  using (auth.uid() = teacher_id);
