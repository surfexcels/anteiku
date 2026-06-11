-- Daily stock counts: opening/closing quantities reconciled with waste logs.

create type public.inventory_day_status as enum ('open', 'closed');

create table public.inventory_days (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  location_id uuid not null,
  stock_date date not null,
  status public.inventory_day_status not null default 'open',
  note text check (char_length(note) <= 500),
  opened_at timestamptz,
  closed_at timestamptz,
  opened_by uuid references auth.users(id),
  closed_by uuid references auth.users(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (business_id, location_id)
    references public.locations (business_id, id),
  unique (business_id, location_id, stock_date),
  unique (business_id, id)
);

create table public.inventory_day_lines (
  id uuid primary key default gen_random_uuid(),
  inventory_day_id uuid not null references public.inventory_days(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  business_product_id uuid not null,
  opening_quantity numeric(12,3) not null default 0 check (opening_quantity >= 0),
  closing_quantity numeric(12,3) check (closing_quantity is null or closing_quantity >= 0),
  note text check (char_length(note) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (business_id, business_product_id)
    references public.business_products (business_id, id),
  unique (inventory_day_id, business_product_id),
  unique (business_id, id)
);

create index inventory_days_business_date_idx
  on public.inventory_days (business_id, stock_date desc);

create index inventory_day_lines_day_idx
  on public.inventory_day_lines (inventory_day_id);

create trigger inventory_days_set_updated_at
  before update on public.inventory_days
  for each row execute function public.set_updated_at();

create trigger inventory_day_lines_set_updated_at
  before update on public.inventory_day_lines
  for each row execute function public.set_updated_at();

create trigger inventory_days_protect_audit_fields
  before update on public.inventory_days
  for each row execute function public.protect_tenant_audit_fields();

alter table public.inventory_days enable row level security;
alter table public.inventory_day_lines enable row level security;

create policy "Members read inventory days" on public.inventory_days
  for select to authenticated
  using (public.is_business_member(business_id));

create policy "Members create inventory days" on public.inventory_days
  for insert to authenticated
  with check (
    public.is_business_member(business_id)
    and created_by = (select auth.uid())
  );

create policy "Members update inventory days" on public.inventory_days
  for update to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "Managers delete inventory days" on public.inventory_days
  for delete to authenticated
  using (
    public.has_business_role(business_id, array['owner','admin','manager']::public.membership_role[])
  );

create policy "Members read inventory day lines" on public.inventory_day_lines
  for select to authenticated
  using (public.is_business_member(business_id));

create policy "Members manage inventory day lines" on public.inventory_day_lines
  for all to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

comment on table public.inventory_days is
  'One stock count session per business location per calendar day.';

comment on table public.inventory_day_lines is
  'Opening and closing quantities per menu item for a daily inventory session.';

comment on column public.inventory_day_lines.opening_quantity is
  'Stock on hand at start of day.';

comment on column public.inventory_day_lines.closing_quantity is
  'Stock on hand at end of day. Usage = opening - closing - waste.';
