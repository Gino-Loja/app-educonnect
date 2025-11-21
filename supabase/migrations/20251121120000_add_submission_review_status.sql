-- Add review status enum for task submissions
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'submission_review_status'
      and n.nspname = 'public'
  ) then
    create type public.submission_review_status as enum (
      'pending_review',
      'changes_requested',
      'approved'
    );
  end if;
end$$;

-- Column to store current review status of a submission
alter table public.task_submissions
  add column if not exists review_status public.submission_review_status not null default 'pending_review';

-- Backfill existing submissions based on legacy is_approved flag
update public.task_submissions
set review_status = (
  case
    when is_approved = true then 'approved'
    when is_approved = false then 'changes_requested'
    else 'pending_review'
  end
)::public.submission_review_status;

comment on column public.task_submissions.review_status is 'Estado de revisión de la entrega (pendiente, cambios solicitados, aprobada)';
