-- Sprint 5: Presentation Controls
-- poll_state already covers Launch (open) and Close (closed). Reveal/Hide is a
-- separate dimension — whether results are shared with participants — so it gets
-- its own column.

alter table public.session_questions
  add column results_revealed boolean not null default false;
