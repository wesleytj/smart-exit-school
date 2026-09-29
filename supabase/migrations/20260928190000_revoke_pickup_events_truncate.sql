-- ============================================================
-- Smart Exit School
-- Migration
-- File: 20260928190000_revoke_pickup_events_truncate.sql
-- Description:
--   Removes TRUNCATE on public.pickup_events from authenticated.
--
-- Preserves:
--   - SELECT, INSERT and UPDATE for authenticated
--   - no DELETE privilege for authenticated
--   - RLS, policies, trigger, functions, FKs, CHECKs and indexes
--
-- Depends on:
--   - 20260928170000_pickup_events_insert_called_only.sql
-- ============================================================

revoke truncate on table public.pickup_events from authenticated;
