begin;

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

create type public.membership_role as enum ('owner', 'admin', 'manager', 'staff');
create type public.product_unit as enum ('item', 'kg', 'g', 'l', 'ml', 'portion', 'pack');
create type public.waste_source as enum ('manual', 'invoice', 'import');
create type public.recommendation_status as enum ('new', 'reviewed', 'accepted', 'dismissed');
create type public.import_status as enum ('pending', 'processing', 'completed', 'failed');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'unpaid');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  timezone text not null default 'Europe/London',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.membership_role not null default 'staff',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  timezone text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, name),
  unique (business_id, id)
);

create table public.catalog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  sort_order integer not null default 0
);

create table public.catalog_products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.catalog_categories(id),
  canonical_name text not null,
  description text,
  default_unit public.product_unit not null default 'item',
  image_url text,
  image_blur_data_url text,
  origin_country_codes text[] not null default '{}',
  available_country_codes text[] not null default '{}',
  source_name text not null default 'anteiku',
  source_external_id text,
  source_url text,
  is_verified boolean not null default false,
  is_active boolean not null default true,
  search_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_name, source_external_id)
);

create table public.catalog_product_aliases (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.catalog_products(id) on delete cascade,
  locale text not null default 'en',
  alias text not null,
  normalized_alias text not null,
  unique (product_id, locale, normalized_alias)
);

create table public.business_products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  catalog_product_id uuid references public.catalog_products(id) on delete set null,
  name text not null check (char_length(name) between 1 and 160),
  image_url text,
  unit public.product_unit not null default 'item',
  unit_cost_minor integer not null check (unit_cost_minor >= 0),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  sku text,
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id)
);

create unique index business_products_catalog_unique_idx
on public.business_products (business_id, catalog_product_id)
where catalog_product_id is not null;

create table public.waste_reasons (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  code text not null,
  label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique nulls not distinct (business_id, code)
);

create table public.waste_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  location_id uuid not null,
  business_product_id uuid not null,
  waste_reason_id uuid references public.waste_reasons(id),
  quantity numeric(12,3) not null check (quantity > 0),
  unit_cost_minor integer not null check (unit_cost_minor >= 0),
  total_cost_minor bigint generated always as (round(quantity * unit_cost_minor)) stored,
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  occurred_at timestamptz not null default now(),
  note text check (char_length(note) <= 500),
  source public.waste_source not null default 'manual',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  foreign key (business_id, location_id)
    references public.locations (business_id, id),
  foreign key (business_id, business_product_id)
    references public.business_products (business_id, id)
);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  title text not null,
  explanation text not null,
  evidence jsonb not null default '{}',
  estimated_annual_impact_minor bigint not null default 0,
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  status public.recommendation_status not null default 'new',
  generated_at timestamptz not null default now(),
  expires_at timestamptz,
  foreign key (business_id, location_id)
    references public.locations (business_id, id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  storage_path text,
  summary jsonb not null default '{}',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  check (period_end >= period_start),
  foreign key (business_id, location_id)
    references public.locations (business_id, id)
);

create table public.supplier_imports (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  storage_path text not null,
  original_filename text not null,
  status public.import_status not null default 'pending',
  result jsonb,
  error_message text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status public.subscription_status not null default 'trialing',
  plan_code text not null default 'starter',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index business_memberships_user_idx on public.business_memberships (user_id, is_active);
create index locations_business_idx on public.locations (business_id, is_active);
create index catalog_products_search_trgm_idx on public.catalog_products using gin (search_text extensions.gin_trgm_ops);
create index catalog_products_countries_idx on public.catalog_products using gin (available_country_codes);
create index catalog_aliases_search_trgm_idx on public.catalog_product_aliases using gin (normalized_alias extensions.gin_trgm_ops);
create index business_products_business_idx on public.business_products (business_id, is_active);
create index waste_logs_business_occurred_idx on public.waste_logs (business_id, occurred_at desc);
create index waste_logs_location_occurred_idx on public.waste_logs (location_id, occurred_at desc);
create index recommendations_business_status_idx on public.recommendations (business_id, status, generated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger businesses_set_updated_at before update on public.businesses
for each row execute function public.set_updated_at();
create trigger locations_set_updated_at before update on public.locations
for each row execute function public.set_updated_at();
create trigger catalog_products_set_updated_at before update on public.catalog_products
for each row execute function public.set_updated_at();
create trigger business_products_set_updated_at before update on public.business_products
for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions
for each row execute function public.set_updated_at();

create or replace function public.protect_tenant_audit_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.business_id <> old.business_id or new.created_by <> old.created_by then
    raise exception 'Tenant and creator fields are immutable';
  end if;
  return new;
end;
$$;

create trigger business_products_protect_audit_fields
before update on public.business_products
for each row execute function public.protect_tenant_audit_fields();
create trigger waste_logs_protect_audit_fields
before update on public.waste_logs
for each row execute function public.protect_tenant_audit_fields();
create trigger reports_protect_audit_fields
before update on public.reports
for each row execute function public.protect_tenant_audit_fields();
create trigger supplier_imports_protect_audit_fields
before update on public.supplier_imports
for each row execute function public.protect_tenant_audit_fields();

create or replace function public.normalize_catalog_text(value text)
returns text
language sql
stable
set search_path = ''
as $$
  select lower(extensions.unaccent(coalesce(value, '')));
$$;

create or replace function public.sync_catalog_search_text()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.search_text = public.normalize_catalog_text(
    concat_ws(' ', new.canonical_name, new.description, array_to_string(new.origin_country_codes, ' '))
  );
  return new;
end;
$$;

create trigger catalog_products_sync_search before insert or update of canonical_name, description, origin_country_codes
on public.catalog_products for each row execute function public.sync_catalog_search_text();

create or replace function public.sync_catalog_alias()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.normalized_alias = public.normalize_catalog_text(new.alias);
  return new;
end;
$$;

create trigger catalog_aliases_sync before insert or update of alias
on public.catalog_product_aliases for each row execute function public.sync_catalog_alias();

create or replace function public.validate_waste_reason_tenant()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  reason_business_id uuid;
begin
  if new.waste_reason_id is null then
    return new;
  end if;

  select business_id
  into reason_business_id
  from public.waste_reasons
  where id = new.waste_reason_id;

  if not found or (reason_business_id is not null and reason_business_id <> new.business_id) then
    raise exception 'Waste reason does not belong to this business';
  end if;

  return new;
end;
$$;

create trigger waste_logs_validate_reason
before insert or update of business_id, waste_reason_id
on public.waste_logs for each row execute function public.validate_waste_reason_tenant();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_memberships membership
    where membership.business_id = target_business_id
      and membership.user_id = (select auth.uid())
      and membership.is_active
  );
$$;

create or replace function public.has_business_role(
  target_business_id uuid,
  allowed_roles public.membership_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_memberships membership
    where membership.business_id = target_business_id
      and membership.user_id = (select auth.uid())
      and membership.is_active
      and membership.role = any(allowed_roles)
  );
$$;

create or replace function public.create_business_with_owner(
  business_name text,
  business_country_code text,
  business_currency_code text,
  business_timezone text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_business_id uuid;
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.businesses (name, country_code, currency_code, timezone, created_by)
  values (
    trim(business_name),
    upper(business_country_code),
    upper(business_currency_code),
    business_timezone,
    current_user_id
  )
  returning id into created_business_id;

  insert into public.business_memberships (business_id, user_id, role)
  values (created_business_id, current_user_id, 'owner');

  insert into public.locations (business_id, name, country_code, timezone)
  values (created_business_id, 'Main location', upper(business_country_code), business_timezone);

  insert into public.subscriptions (business_id)
  values (created_business_id);

  return created_business_id;
end;
$$;

create or replace function public.search_catalog_products(
  search_query text,
  country_code text default null,
  result_limit integer default 20
)
returns table (
  id uuid,
  canonical_name text,
  description text,
  default_unit public.product_unit,
  image_url text,
  category_name text,
  origin_country_codes text[],
  rank real
)
language sql
stable
security invoker
set search_path = ''
as $$
  with query as (
    select public.normalize_catalog_text(search_query) as term
  ),
  matches as (
    select
      product.id,
      product.canonical_name,
      product.description,
      product.default_unit,
      product.image_url,
      category.name as category_name,
      product.origin_country_codes,
      greatest(
        extensions.similarity(product.search_text, query.term),
        coalesce(max(extensions.similarity(alias.normalized_alias, query.term)), 0)
      )::real as rank
    from public.catalog_products product
    left join public.catalog_categories category on category.id = product.category_id
    left join public.catalog_product_aliases alias on alias.product_id = product.id
    cross join query
    where product.is_active
      and (
        query.term = ''
        or product.search_text like query.term || '%'
        or product.search_text operator(extensions.%) query.term
        or alias.normalized_alias like query.term || '%'
        or alias.normalized_alias operator(extensions.%) query.term
      )
      and (
        country_code is null
        or product.available_country_codes = '{}'
        or upper(country_code) = any(product.available_country_codes)
      )
    group by product.id, category.name, query.term
  )
  select *
  from matches
  order by
    case when public.normalize_catalog_text(canonical_name) like public.normalize_catalog_text(search_query) || '%' then 0 else 1 end,
    rank desc,
    canonical_name
  limit least(greatest(result_limit, 1), 50);
$$;

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_memberships enable row level security;
alter table public.locations enable row level security;
alter table public.catalog_categories enable row level security;
alter table public.catalog_products enable row level security;
alter table public.catalog_product_aliases enable row level security;
alter table public.business_products enable row level security;
alter table public.waste_reasons enable row level security;
alter table public.waste_logs enable row level security;
alter table public.recommendations enable row level security;
alter table public.reports enable row level security;
alter table public.supplier_imports enable row level security;
alter table public.subscriptions enable row level security;

create policy "Users read own profile" on public.profiles for select
to authenticated using ((select auth.uid()) = id);
create policy "Users update own profile" on public.profiles for update
to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Members read businesses" on public.businesses for select
to authenticated using (public.is_business_member(id));
create policy "Owners update businesses" on public.businesses for update
to authenticated using (public.has_business_role(id, array['owner']::public.membership_role[]))
with check (public.has_business_role(id, array['owner']::public.membership_role[]));

create policy "Members read memberships" on public.business_memberships for select
to authenticated using (public.is_business_member(business_id));
create policy "Admins manage memberships" on public.business_memberships for all
to authenticated using (public.has_business_role(business_id, array['owner','admin']::public.membership_role[]))
with check (public.has_business_role(business_id, array['owner','admin']::public.membership_role[]));

create policy "Members read locations" on public.locations for select
to authenticated using (public.is_business_member(business_id));
create policy "Admins manage locations" on public.locations for all
to authenticated using (public.has_business_role(business_id, array['owner','admin']::public.membership_role[]))
with check (public.has_business_role(business_id, array['owner','admin']::public.membership_role[]));

create policy "Authenticated users read categories" on public.catalog_categories for select
to authenticated using (true);
create policy "Authenticated users read catalog" on public.catalog_products for select
to authenticated using (is_active);
create policy "Authenticated users read aliases" on public.catalog_product_aliases for select
to authenticated using (true);

create policy "Members read business products" on public.business_products for select
to authenticated using (public.is_business_member(business_id));
create policy "Managers create business products" on public.business_products for insert
to authenticated with check (
  public.has_business_role(business_id, array['owner','admin','manager']::public.membership_role[])
  and created_by = (select auth.uid())
);
create policy "Managers update business products" on public.business_products for update
to authenticated using (public.has_business_role(business_id, array['owner','admin','manager']::public.membership_role[]))
with check (
  public.has_business_role(business_id, array['owner','admin','manager']::public.membership_role[])
);
create policy "Managers delete business products" on public.business_products for delete
to authenticated using (public.has_business_role(business_id, array['owner','admin','manager']::public.membership_role[]));

create policy "Members read waste reasons" on public.waste_reasons for select
to authenticated using (business_id is null or public.is_business_member(business_id));
create policy "Managers manage custom reasons" on public.waste_reasons for all
to authenticated using (
  business_id is not null
  and public.has_business_role(business_id, array['owner','admin','manager']::public.membership_role[])
)
with check (
  business_id is not null
  and public.has_business_role(business_id, array['owner','admin','manager']::public.membership_role[])
);

create policy "Members read waste logs" on public.waste_logs for select
to authenticated using (public.is_business_member(business_id));
create policy "Members create waste logs" on public.waste_logs for insert
to authenticated with check (
  public.is_business_member(business_id)
  and created_by = (select auth.uid())
);
create policy "Managers update waste logs" on public.waste_logs for update
to authenticated using (public.has_business_role(business_id, array['owner','admin','manager']::public.membership_role[]))
with check (public.has_business_role(business_id, array['owner','admin','manager']::public.membership_role[]));
create policy "Managers delete waste logs" on public.waste_logs for delete
to authenticated using (public.has_business_role(business_id, array['owner','admin','manager']::public.membership_role[]));

create policy "Members read recommendations" on public.recommendations for select
to authenticated using (public.is_business_member(business_id));
create policy "Managers update recommendations" on public.recommendations for update
to authenticated using (public.has_business_role(business_id, array['owner','admin','manager']::public.membership_role[]))
with check (public.has_business_role(business_id, array['owner','admin','manager']::public.membership_role[]));

create policy "Members read reports" on public.reports for select
to authenticated using (public.is_business_member(business_id));
create policy "Managers create reports" on public.reports for insert
to authenticated with check (
  public.has_business_role(business_id, array['owner','admin','manager']::public.membership_role[])
  and created_by = (select auth.uid())
);
create policy "Managers update reports" on public.reports for update
to authenticated using (public.has_business_role(business_id, array['owner','admin','manager']::public.membership_role[]))
with check (public.has_business_role(business_id, array['owner','admin','manager']::public.membership_role[]));
create policy "Managers delete reports" on public.reports for delete
to authenticated using (public.has_business_role(business_id, array['owner','admin','manager']::public.membership_role[]));

create policy "Members read imports" on public.supplier_imports for select
to authenticated using (public.is_business_member(business_id));
create policy "Managers create imports" on public.supplier_imports for insert
to authenticated with check (
  public.has_business_role(business_id, array['owner','admin','manager']::public.membership_role[])
  and created_by = (select auth.uid())
);

create policy "Owners read subscriptions" on public.subscriptions for select
to authenticated using (public.has_business_role(business_id, array['owner','admin']::public.membership_role[]));

revoke all on function public.create_business_with_owner(text, text, text, text) from public;
grant execute on function public.create_business_with_owner(text, text, text, text) to authenticated;
revoke all on function public.search_catalog_products(text, text, integer) from public;
grant execute on function public.search_catalog_products(text, text, integer) to authenticated;
revoke all on function public.is_business_member(uuid) from public;
revoke all on function public.has_business_role(uuid, public.membership_role[]) from public;
grant execute on function public.is_business_member(uuid) to authenticated;
grant execute on function public.has_business_role(uuid, public.membership_role[]) to authenticated;

insert into public.waste_reasons (business_id, code, label) values
  (null, 'unsold', 'Unsold at close'),
  (null, 'expired', 'Expired'),
  (null, 'damaged', 'Damaged'),
  (null, 'overproduction', 'Overproduction'),
  (null, 'quality', 'Quality issue'),
  (null, 'staff', 'Staff meal'),
  (null, 'other', 'Other');

commit;
