-- Hardening: pin search_path on set_updated_at (Supabase lint 0011,
-- "Function Search Path Mutable"). With an empty search_path every reference
-- must be schema-qualified, so now() becomes pg_catalog.now(). The function body
-- is otherwise unchanged, so all existing updated_at triggers keep working.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;
