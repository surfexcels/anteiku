create table public.business_invitations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  email text not null,
  role public.membership_role not null default 'staff',
  full_name text,
  invited_by uuid not null references auth.users (id),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint business_invitations_email_unique unique (business_id, email)
);

create index business_invitations_pending_email_idx
  on public.business_invitations (lower(email))
  where accepted_at is null;

alter table public.business_invitations enable row level security;

create policy "Admins manage invitations"
  on public.business_invitations
  for all
  to authenticated
  using (
    public.has_business_role(
      business_id,
      array['owner', 'admin']::public.membership_role[]
    )
  )
  with check (
    public.has_business_role(
      business_id,
      array['owner', 'admin']::public.membership_role[]
    )
  );

create or replace function public.accept_pending_invitations()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  user_email text;
  invite record;
  accepted_count integer := 0;
begin
  if current_user_id is null then
    return 0;
  end if;

  select lower(email)
  into user_email
  from auth.users
  where id = current_user_id;

  if user_email is null then
    return 0;
  end if;

  if exists (
    select 1
    from public.business_memberships
    where user_id = current_user_id
      and is_active = true
  ) then
    return 0;
  end if;

  for invite in
    select id, business_id, role, full_name
    from public.business_invitations
    where lower(email) = user_email
      and accepted_at is null
    order by created_at asc
    limit 1
  loop
    insert into public.business_memberships (business_id, user_id, role)
    values (invite.business_id, current_user_id, invite.role);

    if invite.full_name is not null then
      update public.profiles
      set full_name = coalesce(public.profiles.full_name, invite.full_name)
      where id = current_user_id;
    end if;

    update public.business_invitations
    set accepted_at = now()
    where id = invite.id;

    accepted_count := accepted_count + 1;
  end loop;

  return accepted_count;
end;
$$;

grant execute on function public.accept_pending_invitations() to authenticated;

create or replace function public.find_user_id_by_email(target_email text)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select id
  from auth.users
  where lower(email) = lower(trim(target_email))
  limit 1;
$$;

grant execute on function public.find_user_id_by_email(text) to service_role;
