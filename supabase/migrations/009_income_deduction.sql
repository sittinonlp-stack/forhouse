-- Add deduction fields to income_records
alter table public.income_records
  add column if not exists deduction_pct  numeric(5,2) default 0,
  add column if not exists deduction_note text;
