# Database migration order

The production database is currently empty. The migration contract is therefore a fresh baseline, not an upgrade of an existing application schema.

1. `001_initial_schema.sql` — canonical tables, constraints, indexes, RLS enablement, and audit/update triggers.
2. `002_contract_hardening.sql` — post-baseline hardening and removal of the unused legacy `public.rls_auto_enable()` function.

Do not run `002_contract_hardening.sql` before `001_initial_schema.sql` has been successfully applied and validated.

`db/supabase_schema.sql` is retained as a legacy schema artifact during repository cleanup and must not be treated as the migration source of truth.
