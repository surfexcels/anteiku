-- Allow staff to undo accidental floor taps on their own recent logs.
create policy "Members delete own recent waste logs"
  on public.waste_logs
  for delete
  to authenticated
  using (
    public.is_business_member(business_id)
    and created_by = (select auth.uid())
    and occurred_at > now() - interval '10 minutes'
  );
