-- Agrega referencia de liquidacion a pagos de cursos

alter table public.payments
  add column if not exists payout_id uuid references public.payouts(id) on delete set null;

create index if not exists payments_payout_id_idx on public.payments(payout_id);
