-- Create academic_catalog table to manage subjects and academic levels (admin managed)
create table if not exists public.academic_catalog (
    id uuid primary key default gen_random_uuid(),
    type text not null check (type in ('subject','level')),
    label text not null,
    order_index integer,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists academic_catalog_type_label_idx on public.academic_catalog (type, lower(label));
create index if not exists academic_catalog_type_order_idx on public.academic_catalog (type, order_index nulls last, label);

create or replace function update_academic_catalog_timestamp() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists academic_catalog_timestamp on public.academic_catalog;
create trigger academic_catalog_timestamp
  before update on public.academic_catalog
  for each row execute function update_academic_catalog_timestamp();

alter table public.academic_catalog enable row level security;

drop policy if exists "Admins can manage academic catalog" on public.academic_catalog;
create policy "Admins can manage academic catalog"
  on public.academic_catalog
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- Seed with a few defaults if table is empty
insert into public.academic_catalog (type, label, order_index)
select 'subject', val, idx
from (values
  ('Matemáticas', 1),
  ('Física', 2),
  ('Química', 3),
  ('Programación', 4),
  ('Redacción Académica', 5)
) as t(val, idx)
where not exists (select 1 from public.academic_catalog);

insert into public.academic_catalog (type, label, order_index)
select 'level', val, idx
from (values
  ('Bachillerato', 1),
  ('Pregrado', 2),
  ('Postgrado', 3)
) as t(val, idx)
where not exists (
  select 1 from public.academic_catalog where type = 'level'
);
