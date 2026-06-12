-- Platform operators (Anteiku internal). Separate from tenant business_memberships roles.

create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create index platform_admins_email_idx on public.platform_admins (lower(email));

alter table public.platform_admins enable row level security;

-- Operators may read their own row only (used for self-check via authenticated client).
create policy "Platform admins read self" on public.platform_admins
  for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to authenticated;

comment on table public.platform_admins is
  'Anteiku internal operators. App provisions rows for emails in ANTEIKU_SUPER_ADMIN_EMAILS.';

-- Let workspace members see teammate display names in settings.
create policy "Members read teammate profiles" on public.profiles
  for select to authenticated
  using (
    exists (
      select 1
      from public.business_memberships mine
      join public.business_memberships theirs
        on mine.business_id = theirs.business_id
      where mine.user_id = (select auth.uid())
        and mine.is_active = true
        and theirs.user_id = profiles.id
        and theirs.is_active = true
    )
  );
