-- Carbon footprint (CO2e) tracking for EU EmpCo / PEF-aligned cafe reporting.
-- Values are grams CO2-equivalent per product unit at time of logging.

create type public.co2e_source as enum (
  'benchmark',
  'manual',
  'supplier',
  'verified'
);

alter table public.business_products
  add column if not exists unit_co2e_g numeric(12, 3) check (unit_co2e_g is null or unit_co2e_g >= 0),
  add column if not exists co2e_source public.co2e_source not null default 'benchmark',
  add column if not exists co2e_methodology text,
  add column if not exists co2e_updated_at timestamptz;

alter table public.waste_logs
  add column if not exists unit_co2e_g numeric(12, 3) check (unit_co2e_g is null or unit_co2e_g >= 0),
  add column if not exists total_co2e_g numeric(14, 3) generated always as (
    round(quantity * coalesce(unit_co2e_g, 0), 3)
  ) stored;

alter table public.businesses
  add column if not exists carbon_disclosure_enabled boolean not null default true;

comment on column public.business_products.unit_co2e_g is
  'Grams CO2-equivalent per menu unit (item, portion, kg, etc.).';
comment on column public.business_products.co2e_source is
  'How the factor was determined — required for EmpCo substantiation.';
comment on column public.waste_logs.unit_co2e_g is
  'Snapshotted grams CO2e per unit when the waste entry was created.';

create index if not exists waste_logs_business_co2e_idx
  on public.waste_logs (business_id, occurred_at desc)
  where unit_co2e_g is not null;
