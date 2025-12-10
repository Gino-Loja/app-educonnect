-- Cursos y ventas internas (sin pasarela externa)

-- Tabla principal de cursos
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  price numeric(12,2) not null default 0 check (price >= 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'unlisted')),
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists courses_teacher_id_idx on public.courses (teacher_id);
create index if not exists courses_status_idx on public.courses (status);

drop trigger if exists update_courses_updated_at on public.courses;
create trigger update_courses_updated_at
  before update on public.courses
  for each row
  execute function update_updated_at_column();

alter table public.courses enable row level security;

create policy "Courses are viewable by owners, published visibility, or admin"
  on public.courses
  for select
  using (
    status in ('published', 'unlisted')
    or teacher_id = auth.uid()
    or is_admin(auth.uid())
  );

create policy "Teachers insert their own courses"
  on public.courses
  for insert
  with check (
    teacher_id = auth.uid()
    or is_admin(auth.uid())
  );

create policy "Teachers update their own courses"
  on public.courses
  for update
  using (
    teacher_id = auth.uid()
    or is_admin(auth.uid())
  )
  with check (
    teacher_id = auth.uid()
    or is_admin(auth.uid())
  );

create policy "Teachers delete their own courses"
  on public.courses
  for delete
  using (
    teacher_id = auth.uid()
    or is_admin(auth.uid())
  );

-- Modulos de un curso
create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  position integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists course_modules_course_id_idx on public.course_modules (course_id);

drop trigger if exists update_course_modules_updated_at on public.course_modules;
create trigger update_course_modules_updated_at
  before update on public.course_modules
  for each row
  execute function update_updated_at_column();

alter table public.course_modules enable row level security;

create policy "Course modules are selectable when course is visible or owned"
  on public.course_modules
  for select
  using (
    exists (
      select 1
      from public.courses c
      where c.id = course_id
        and (
          c.status in ('published', 'unlisted')
          or c.teacher_id = auth.uid()
          or is_admin(auth.uid())
        )
    )
  );

create policy "Teachers insert modules for their courses"
  on public.course_modules
  for insert
  with check (
    exists (
      select 1
      from public.courses c
      where c.id = course_id
        and (
          c.teacher_id = auth.uid()
          or is_admin(auth.uid())
        )
    )
  );

create policy "Teachers update modules for their courses"
  on public.course_modules
  for update
  using (
    exists (
      select 1
      from public.courses c
      where c.id = course_id
        and (
          c.teacher_id = auth.uid()
          or is_admin(auth.uid())
        )
    )
  )
  with check (
    exists (
      select 1
      from public.courses c
      where c.id = course_id
        and (
          c.teacher_id = auth.uid()
          or is_admin(auth.uid())
        )
    )
  );

create policy "Teachers delete modules for their courses"
  on public.course_modules
  for delete
  using (
    exists (
      select 1
      from public.courses c
      where c.id = course_id
        and (
          c.teacher_id = auth.uid()
          or is_admin(auth.uid())
        )
    )
  );

-- Lecciones de un módulo
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  title text not null,
  content_url text,
  content_type text,
  duration_minutes integer,
  position integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lessons_module_id_idx on public.lessons (module_id);

drop trigger if exists update_lessons_updated_at on public.lessons;
create trigger update_lessons_updated_at
  before update on public.lessons
  for each row
  execute function update_updated_at_column();

alter table public.lessons enable row level security;

create policy "Lessons are selectable when course is visible or owned"
  on public.lessons
  for select
  using (
    exists (
      select 1
      from public.course_modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_id
        and (
          c.status in ('published', 'unlisted')
          or c.teacher_id = auth.uid()
          or is_admin(auth.uid())
        )
    )
  );

create policy "Teachers insert lessons for their modules"
  on public.lessons
  for insert
  with check (
    exists (
      select 1
      from public.course_modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_id
        and (
          c.teacher_id = auth.uid()
          or is_admin(auth.uid())
        )
    )
  );

create policy "Teachers update lessons for their modules"
  on public.lessons
  for update
  using (
    exists (
      select 1
      from public.course_modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_id
        and (
          c.teacher_id = auth.uid()
          or is_admin(auth.uid())
        )
    )
  )
  with check (
    exists (
      select 1
      from public.course_modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_id
        and (
          c.teacher_id = auth.uid()
          or is_admin(auth.uid())
        )
    )
  );

create policy "Teachers delete lessons for their modules"
  on public.lessons
  for delete
  using (
    exists (
      select 1
      from public.course_modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_id
        and (
          c.teacher_id = auth.uid()
          or is_admin(auth.uid())
        )
    )
  );

-- Inscripciones de estudiantes a cursos
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'active', 'refunded')),
  paid_amount numeric(12,2) not null default 0 check (paid_amount >= 0),
  proof_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists enrollments_course_id_idx on public.enrollments (course_id);
create index if not exists enrollments_student_id_idx on public.enrollments (student_id);
create unique index if not exists enrollments_unique_active_or_pending
  on public.enrollments (course_id, student_id)
  where status in ('pending', 'active');

drop trigger if exists update_enrollments_updated_at on public.enrollments;
create trigger update_enrollments_updated_at
  before update on public.enrollments
  for each row
  execute function update_updated_at_column();

alter table public.enrollments enable row level security;

create policy "Enrollments are viewable by student, course teacher, or admin"
  on public.enrollments
  for select
  using (
    student_id = auth.uid()
    or is_admin(auth.uid())
    or exists (
      select 1
      from public.courses c
      where c.id = course_id
        and c.teacher_id = auth.uid()
    )
  );

create policy "Students create enrollments for themselves"
  on public.enrollments
  for insert
  with check (
    student_id = auth.uid()
    or is_admin(auth.uid())
  );

create policy "Students or admin update their enrollments"
  on public.enrollments
  for update
  using (
    student_id = auth.uid()
    or is_admin(auth.uid())
  )
  with check (
    student_id = auth.uid()
    or is_admin(auth.uid())
  );

create policy "Students or admin delete their enrollments"
  on public.enrollments
  for delete
  using (
    student_id = auth.uid()
    or is_admin(auth.uid())
  );

-- Pagos manuales asociados a una inscripcion
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  method text not null check (method in ('transfer', 'efectivo')),
  status text not null default 'pending' check (status in ('pending', 'verified', 'refused')),
  proof_url text,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_enrollment_id_idx on public.payments (enrollment_id);
create index if not exists payments_status_idx on public.payments (status);
create index if not exists payments_verified_by_idx on public.payments (verified_by);

drop trigger if exists update_payments_updated_at on public.payments;
create trigger update_payments_updated_at
  before update on public.payments
  for each row
  execute function update_updated_at_column();

alter table public.payments enable row level security;

create policy "Payments are viewable by enrollment student, course teacher, or admin"
  on public.payments
  for select
  using (
    is_admin(auth.uid())
    or exists (
      select 1
      from public.enrollments e
      join public.courses c on c.id = e.course_id
      where e.id = enrollment_id
        and (
          e.student_id = auth.uid()
          or c.teacher_id = auth.uid()
        )
    )
  );

create policy "Payments can be inserted by student or admin"
  on public.payments
  for insert
  with check (
    exists (
      select 1
      from public.enrollments e
      where e.id = enrollment_id
        and (
          e.student_id = auth.uid()
          or is_admin(auth.uid())
        )
    )
  );

create policy "Payments can be updated by student or admin"
  on public.payments
  for update
  using (
    exists (
      select 1
      from public.enrollments e
      where e.id = enrollment_id
        and (
          e.student_id = auth.uid()
          or is_admin(auth.uid())
        )
    )
  )
  with check (
    exists (
      select 1
      from public.enrollments e
      where e.id = enrollment_id
        and (
          e.student_id = auth.uid()
          or is_admin(auth.uid())
        )
    )
  );

create policy "Payments can be deleted by student or admin"
  on public.payments
  for delete
  using (
    exists (
      select 1
      from public.enrollments e
      where e.id = enrollment_id
        and (
          e.student_id = auth.uid()
          or is_admin(auth.uid())
        )
    )
  );

-- Pagos a docentes (liquidaciones)
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  period text,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists payouts_teacher_id_idx on public.payouts (teacher_id);
create index if not exists payouts_status_idx on public.payouts (status);

alter table public.payouts enable row level security;

create policy "Payouts are viewable by teacher or admin"
  on public.payouts
  for select
  using (
    teacher_id = auth.uid()
    or is_admin(auth.uid())
  );

create policy "Admins manage payouts"
  on public.payouts
  for insert
  with check (is_admin(auth.uid()));

create policy "Admins update payouts"
  on public.payouts
  for update
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

create policy "Admins delete payouts"
  on public.payouts
  for delete
  using (is_admin(auth.uid()));
