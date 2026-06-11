-- Sprint 2: Session Management
-- A session is a live/completed run of a workshop carrying a unique join code.
-- session_questions are the per-session instances of questions with poll state
-- and launch order. RLS keeps sessions private to the owning facilitator;
-- participants reach an active session only through check_session_code().

create type public.session_status as enum ('draft', 'active', 'ended');
create type public.poll_state as enum ('pending', 'open', 'closed');

-- ---------------------------------------------------------------------------
-- sessions
-- ---------------------------------------------------------------------------
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops (id) on delete cascade,
  session_code text not null,
  status public.session_status not null default 'draft',
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index sessions_session_code_key on public.sessions (session_code);
create index sessions_workshop_id_idx on public.sessions (workshop_id);

create trigger sessions_set_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();

alter table public.sessions enable row level security;

create policy "Facilitators read own sessions"
  on public.sessions for select
  using (
    exists (
      select 1 from public.workshops w
      where w.id = sessions.workshop_id and w.owner_id = auth.uid()
    )
  );

create policy "Facilitators insert own sessions"
  on public.sessions for insert
  with check (
    exists (
      select 1 from public.workshops w
      where w.id = sessions.workshop_id and w.owner_id = auth.uid()
    )
  );

create policy "Facilitators update own sessions"
  on public.sessions for update
  using (
    exists (
      select 1 from public.workshops w
      where w.id = sessions.workshop_id and w.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workshops w
      where w.id = sessions.workshop_id and w.owner_id = auth.uid()
    )
  );

create policy "Facilitators delete own sessions"
  on public.sessions for delete
  using (
    exists (
      select 1 from public.workshops w
      where w.id = sessions.workshop_id and w.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- session_questions
-- ---------------------------------------------------------------------------
create table public.session_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  launch_order integer not null default 0,
  poll_state public.poll_state not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index session_questions_session_id_idx
  on public.session_questions (session_id);
create unique index session_questions_session_question_key
  on public.session_questions (session_id, question_id);

create trigger session_questions_set_updated_at
  before update on public.session_questions
  for each row execute function public.set_updated_at();

alter table public.session_questions enable row level security;

create policy "Facilitators read own session questions"
  on public.session_questions for select
  using (
    exists (
      select 1
      from public.sessions s
      join public.workshops w on w.id = s.workshop_id
      where s.id = session_questions.session_id and w.owner_id = auth.uid()
    )
  );

create policy "Facilitators insert own session questions"
  on public.session_questions for insert
  with check (
    exists (
      select 1
      from public.sessions s
      join public.workshops w on w.id = s.workshop_id
      where s.id = session_questions.session_id and w.owner_id = auth.uid()
    )
  );

create policy "Facilitators update own session questions"
  on public.session_questions for update
  using (
    exists (
      select 1
      from public.sessions s
      join public.workshops w on w.id = s.workshop_id
      where s.id = session_questions.session_id and w.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.sessions s
      join public.workshops w on w.id = s.workshop_id
      where s.id = session_questions.session_id and w.owner_id = auth.uid()
    )
  );

create policy "Facilitators delete own session questions"
  on public.session_questions for delete
  using (
    exists (
      select 1
      from public.sessions s
      join public.workshops w on w.id = s.workshop_id
      where s.id = session_questions.session_id and w.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- check_session_code: participant-facing lookup.
-- SECURITY DEFINER so an anonymous participant can resolve an ACTIVE session by
-- its join code without read access to the sessions table. Returns at most one
-- row; nothing for unknown or non-active codes. Codes are matched case-insensitively.
-- ---------------------------------------------------------------------------
create or replace function public.check_session_code(code text)
returns table (id uuid, status public.session_status)
language sql
security definer
set search_path = public
as $$
  select s.id, s.status
  from public.sessions s
  where upper(s.session_code) = upper(code)
    and s.status = 'active'
  limit 1;
$$;

revoke all on function public.check_session_code(text) from public;
grant execute on function public.check_session_code(text) to anon, authenticated;
