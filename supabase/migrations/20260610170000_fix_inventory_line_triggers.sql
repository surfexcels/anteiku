-- inventory_day_lines has no created_by; protect_tenant_audit_fields breaks upserts.

drop trigger if exists inventory_day_lines_protect_audit_fields on public.inventory_day_lines;
