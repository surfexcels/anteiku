-- Products are business-owned; location_products controls which sites carry each item.

create table public.location_products (
  business_id uuid not null references public.businesses(id) on delete cascade,
  location_id uuid not null,
  business_product_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (location_id, business_product_id),
  foreign key (business_id, location_id)
    references public.locations (business_id, id) on delete cascade,
  foreign key (business_id, business_product_id)
    references public.business_products (business_id, id) on delete cascade
);

create index location_products_business_location_idx
  on public.location_products (business_id, location_id);

alter table public.location_products enable row level security;

create policy location_products_select on public.location_products
  for select using (public.is_business_member(business_id));

create policy location_products_insert on public.location_products
  for insert with check (public.is_business_member(business_id));

create policy location_products_delete on public.location_products
  for delete using (public.is_business_member(business_id));

-- Sites that already logged waste or stock for a product keep that product.
insert into public.location_products (business_id, location_id, business_product_id)
select distinct wl.business_id, wl.location_id, wl.business_product_id
from public.waste_logs wl
on conflict do nothing;

insert into public.location_products (business_id, location_id, business_product_id)
select distinct iday.business_id, iday.location_id, idl.business_product_id
from public.inventory_day_lines idl
join public.inventory_days iday on iday.id = idl.inventory_day_id
on conflict do nothing;

-- Legacy products with no site activity stay on the business's first location only.
insert into public.location_products (business_id, location_id, business_product_id)
select
  bp.business_id,
  (
    select l.id
    from public.locations l
    where l.business_id = bp.business_id
    order by l.created_at asc
    limit 1
  ),
  bp.id
from public.business_products bp
where not exists (
  select 1
  from public.location_products lp
  where lp.business_product_id = bp.id
)
on conflict do nothing;
