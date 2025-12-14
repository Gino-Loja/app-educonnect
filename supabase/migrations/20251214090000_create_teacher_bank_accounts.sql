-- Enable uuid generation
create extension if not exists "pgcrypto";

-- Create table for teacher bank accounts (one per teacher)
create table if not exists public.teacher_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  bank_name text not null,
  account_holder text not null,
  account_number text not null,
  account_type text,
  routing_number text,
  account_alias text,
  country text,
  currency text default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teacher_bank_accounts_teacher_unique unique(teacher_id)
);

alter table public.teacher_bank_accounts enable row level security;

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_teacher_bank_accounts_updated_at on public.teacher_bank_accounts;
create trigger update_teacher_bank_accounts_updated_at
  before update on public.teacher_bank_accounts
  for each row
  execute function public.update_updated_at_column();

-- Policies: teacher can manage own row; admins can read all
create policy "teacher_bank_accounts_select_self_or_admin"
  on public.teacher_bank_accounts
  for select
  using (
    teacher_id = auth.uid()
    or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "teacher_bank_accounts_insert_self_or_admin"
  on public.teacher_bank_accounts
  for insert
  with check (
    teacher_id = auth.uid()
    or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "teacher_bank_accounts_update_self_or_admin"
  on public.teacher_bank_accounts
  for update
  using (
    teacher_id = auth.uid()
    or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    teacher_id = auth.uid()
    or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "teacher_bank_accounts_delete_admin"
  on public.teacher_bank_accounts
  for delete
  using (
    exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );
