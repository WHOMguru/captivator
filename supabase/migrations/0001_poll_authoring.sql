-- Sprint 1: Poll Authoring
-- Tables: workshops, questions, slide_links. RLS enforced from creation.
-- Ownership cascades from workshops.owner_id (= auth.uid()) down to questions
-- and slide_links.

-- Question kinds supported by the authoring UI.
create type public.question_type as enum (
  'multiple_choice',
  'word_cloud',
  'open_text',
  'ranking'
);

-- Keeps updated_at fresh on every row mutation.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- workshops: top-level container owned by a facilitator.
-- ---------------------------------------------------------------------------
create table public.workshops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workshops_owner_id_idx on public.workshops (owner_id);

create trigger workshops_set_updated_at
  before update on public.workshops
  for each row execute function public.set_updated_at();

alter table public.workshops enable row level security;

create policy "Facilitators read own workshops"
  on public.workshops for select
  using (owner_id = auth.uid());

create policy "Facilitators insert own workshops"
  on public.workshops for insert
  with check (owner_id = auth.uid());

create policy "Facilitators update own workshops"
  on public.workshops for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Facilitators delete own workshops"
  on public.workshops for delete
  using (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- questions: reusable question definitions, scoped to a workshop.
-- ---------------------------------------------------------------------------
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops (id) on delete cascade,
  type public.question_type not null,
  prompt text not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index questions_workshop_id_idx on public.questions (workshop_id);

create trigger questions_set_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

alter table public.questions enable row level security;

-- Access cascades through the owning workshop.
create policy "Facilitators read own questions"
  on public.questions for select
  using (
    exists (
      select 1 from public.workshops w
      where w.id = questions.workshop_id and w.owner_id = auth.uid()
    )
  );

create policy "Facilitators insert own questions"
  on public.questions for insert
  with check (
    exists (
      select 1 from public.workshops w
      where w.id = questions.workshop_id and w.owner_id = auth.uid()
    )
  );

create policy "Facilitators update own questions"
  on public.questions for update
  using (
    exists (
      select 1 from public.workshops w
      where w.id = questions.workshop_id and w.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workshops w
      where w.id = questions.workshop_id and w.owner_id = auth.uid()
    )
  );

create policy "Facilitators delete own questions"
  on public.questions for delete
  using (
    exists (
      select 1 from public.workshops w
      where w.id = questions.workshop_id and w.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- slide_links: binds a question to a PowerPoint slide id within a deck.
-- Slide ids are opaque strings supplied by Office.js — never parsed.
-- ---------------------------------------------------------------------------
create table public.slide_links (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  slide_id text not null,
  deck_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index slide_links_question_id_idx on public.slide_links (question_id);
create unique index slide_links_question_id_key on public.slide_links (question_id);

create trigger slide_links_set_updated_at
  before update on public.slide_links
  for each row execute function public.set_updated_at();

alter table public.slide_links enable row level security;

-- Access cascades question -> workshop -> owner.
create policy "Facilitators read own slide links"
  on public.slide_links for select
  using (
    exists (
      select 1
      from public.questions q
      join public.workshops w on w.id = q.workshop_id
      where q.id = slide_links.question_id and w.owner_id = auth.uid()
    )
  );

create policy "Facilitators insert own slide links"
  on public.slide_links for insert
  with check (
    exists (
      select 1
      from public.questions q
      join public.workshops w on w.id = q.workshop_id
      where q.id = slide_links.question_id and w.owner_id = auth.uid()
    )
  );

create policy "Facilitators update own slide links"
  on public.slide_links for update
  using (
    exists (
      select 1
      from public.questions q
      join public.workshops w on w.id = q.workshop_id
      where q.id = slide_links.question_id and w.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.questions q
      join public.workshops w on w.id = q.workshop_id
      where q.id = slide_links.question_id and w.owner_id = auth.uid()
    )
  );

create policy "Facilitators delete own slide links"
  on public.slide_links for delete
  using (
    exists (
      select 1
      from public.questions q
      join public.workshops w on w.id = q.workshop_id
      where q.id = slide_links.question_id and w.owner_id = auth.uid()
    )
  );
