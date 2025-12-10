-- Tabla de preguntas asociadas a una lección (exámenes/quiz)
create table if not exists public.lesson_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  question_type text not null check (question_type in ('multiple_choice', 'true_false', 'short_answer', 'essay')),
  prompt text not null,
  options jsonb,
  correct_answer text,
  feedback text,
  position integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists lesson_questions_lesson_id_idx on public.lesson_questions (lesson_id);

alter table public.lesson_questions enable row level security;

-- Lectura: docente dueño, admin, o estudiante con inscripción activa al curso de la lección.
create policy "Lesson questions readable by owner, admin, or enrolled student"
  on public.lesson_questions
  for select
  using (
    exists (
      select 1
      from public.lessons l
      join public.course_modules m on m.id = l.module_id
      join public.courses c on c.id = m.course_id
      where l.id = lesson_id
        and (
          c.teacher_id = auth.uid()
          or is_admin(auth.uid())
          or exists (
            select 1
            from public.enrollments e
            where e.course_id = c.id
              and e.student_id = auth.uid()
              and e.status = 'active'
          )
        )
    )
  );

-- Escritura: solo docente dueño o admin.
create policy "Lesson questions insert by owner or admin"
  on public.lesson_questions
  for insert
  with check (
    exists (
      select 1
      from public.lessons l
      join public.course_modules m on m.id = l.module_id
      join public.courses c on c.id = m.course_id
      where l.id = lesson_id
        and (c.teacher_id = auth.uid() or is_admin(auth.uid()))
    )
  );

create policy "Lesson questions update by owner or admin"
  on public.lesson_questions
  for update
  using (
    exists (
      select 1
      from public.lessons l
      join public.course_modules m on m.id = l.module_id
      join public.courses c on c.id = m.course_id
      where l.id = lesson_id
        and (c.teacher_id = auth.uid() or is_admin(auth.uid()))
    )
  )
  with check (
    exists (
      select 1
      from public.lessons l
      join public.course_modules m on m.id = l.module_id
      join public.courses c on c.id = m.course_id
      where l.id = lesson_id
        and (c.teacher_id = auth.uid() or is_admin(auth.uid()))
    )
  );

create policy "Lesson questions delete by owner or admin"
  on public.lesson_questions
  for delete
  using (
    exists (
      select 1
      from public.lessons l
      join public.course_modules m on m.id = l.module_id
      join public.courses c on c.id = m.course_id
      where l.id = lesson_id
        and (c.teacher_id = auth.uid() or is_admin(auth.uid()))
    )
  );
