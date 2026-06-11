-- Sprint 3: Participant Experience
-- participants: one row per join (anonymous by default). responses: one answer
-- per participant per session_question.
--
-- Participants have no Supabase Auth identity, so participant reads/writes are
-- performed server-side with the service role after verifying an httpOnly join
-- cookie and an active session (see lib/supabase/admin.ts and the participant
-- API routes). RLS here therefore grants read access to the owning facilitator
-- and otherwise defaults to deny; the service role bypasses RLS by design.

-- ---------------------------------------------------------------------------
-- participants
-- ---------------------------------------------------------------------------
create table public.participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  display_name text,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index participants_session_id_idx on public.participants (session_id);

create trigger participants_set_updated_at
  before update on public.participants
  for each row execute function public.set_updated_at();

alter table public.participants enable row level security;

create policy "Facilitators read participants of own sessions"
  on public.participants for select
  using (
    exists (
      select 1
      from public.sessions s
      join public.workshops w on w.id = s.workshop_id
      where s.id = participants.session_id and w.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- responses
-- ---------------------------------------------------------------------------
create table public.responses (
  id uuid primary key default gen_random_uuid(),
  session_question_id uuid not null
    references public.session_questions (id) on delete cascade,
  participant_id uuid not null references public.participants (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index responses_session_question_id_idx
  on public.responses (session_question_id);
-- One answer per participant per session question (resubmits upsert).
create unique index responses_question_participant_key
  on public.responses (session_question_id, participant_id);

create trigger responses_set_updated_at
  before update on public.responses
  for each row execute function public.set_updated_at();

alter table public.responses enable row level security;

create policy "Facilitators read responses of own sessions"
  on public.responses for select
  using (
    exists (
      select 1
      from public.session_questions sq
      join public.sessions s on s.id = sq.session_id
      join public.workshops w on w.id = s.workshop_id
      where sq.id = responses.session_question_id and w.owner_id = auth.uid()
    )
  );
