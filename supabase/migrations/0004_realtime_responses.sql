-- Sprint 4: Live Results
-- Enable Postgres-changes Realtime on responses so the facilitator's results
-- panel updates within a second of a submission. RLS still applies to the
-- subscriber: a facilitator receives only responses for their own sessions
-- (see the SELECT policy in 0003). REPLICA IDENTITY FULL ships the full row so
-- Realtime can evaluate RLS and surface upsert (UPDATE) payloads.

alter table public.responses replica identity full;

alter publication supabase_realtime add table public.responses;
