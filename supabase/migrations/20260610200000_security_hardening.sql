-- Security hardening: onboarding guard, RLS alignment, storage upload policy.

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

  if exists (
    select 1
    from public.business_memberships
    where user_id = current_user_id
      and is_active = true
  ) then
    raise exception 'User already belongs to a business';
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

create policy "Managers create recommendations" on public.recommendations
  for insert to authenticated
  with check (
    public.has_business_role(
      business_id,
      array['owner', 'admin', 'manager']::public.membership_role[]
    )
  );

drop policy if exists "Members update inventory days" on public.inventory_days;

create policy "Managers update inventory days" on public.inventory_days
  for update to authenticated
  using (
    public.has_business_role(
      business_id,
      array['owner', 'admin', 'manager']::public.membership_role[]
    )
  )
  with check (
    public.has_business_role(
      business_id,
      array['owner', 'admin', 'manager']::public.membership_role[]
    )
  );

drop policy if exists "Members upload supplier imports" on storage.objects;

create policy "Managers upload supplier imports"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'supplier-imports'
  and (storage.foldername(name))[1] = 'imports'
  and public.has_business_role(
    ((storage.foldername(name))[2])::uuid,
    array['owner', 'admin', 'manager']::public.membership_role[]
  )
);
