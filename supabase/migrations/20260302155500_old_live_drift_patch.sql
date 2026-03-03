-- Drift patch placeholder for old-live reconciliation
-- Source project: <old_project_ref>
-- Destination project: cpdxgnrpboreraiwcqgl
--
-- Populate this file only after comparing old live schema export vs local migrations.
-- Keep all statements idempotent.

DO $$
BEGIN
  RAISE NOTICE 'No drift patch applied: awaiting old live schema export and diff.';
END $$;
