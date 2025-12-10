-- Add passing score for quiz lessons
alter table public.lessons
  add column if not exists pass_score integer
  check (pass_score between 0 and 100)
  default 70;

comment on column public.lessons.pass_score is 'Porcentaje requerido para aprobar quizzes (0-100)';
