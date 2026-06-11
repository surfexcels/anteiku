-- Active location per member (foundation for multi-site + staff context).

create table public.member_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  active_location_id uuid not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, business_id),
  foreign key (business_id, active_location_id)
    references public.locations (business_id, id)
);

create index member_preferences_business_idx
  on public.member_preferences (business_id);

create trigger member_preferences_set_updated_at
  before update on public.member_preferences
  for each row execute function public.set_updated_at();

alter table public.member_preferences enable row level security;

create policy "Members read own preferences" on public.member_preferences
  for select to authenticated
  using (
    user_id = (select auth.uid())
    and public.is_business_member(business_id)
  );

create policy "Members upsert own preferences" on public.member_preferences
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_business_member(business_id)
  );

create policy "Members update own preferences" on public.member_preferences
  for update to authenticated
  using (
    user_id = (select auth.uid())
    and public.is_business_member(business_id)
  )
  with check (
    user_id = (select auth.uid())
    and public.is_business_member(business_id)
  );

comment on table public.member_preferences is
  'Per-user active location within a business. One row per user per business tenant.';
