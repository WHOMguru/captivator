# Follow-ups

Deferred items surfaced during sprint work. Keep this list short; promote items
into a sprint when they're scheduled.

## Deferred verification

### PowerPoint add-in sideload — SCHEDULED (between Sprint 6 and Sprint 7)

Verifying the add-in inside the PowerPoint desktop host (side-loading
`public/manifest.xml`, the ribbon button, the task pane, slide-change tracking,
and the full Launch → Close → Reveal → Hide cycle) can't be done on our own
tenant. Reasons:

- **Tenant/policy restrictions** block add-in side-loading on the primary user's
  machine.
- The **Microsoft 365 Developer Program** is no longer accepting this account
  for a developer sandbox tenant, so we can't provision an unrestricted
  environment to test in.

**Resolution: a contracted Office add-in developer runs the host verification on
their own (unrestricted) tenant.** Scheduled as a hard gate between Sprint 6 and
Sprint 7 so it can't keep slipping.

**Owner:** external contracted Office add-in developer.
**Gate:** Sprint 7 (Reporting) does not start until this verification is signed
off or explicitly waived in writing here. It runs alongside Sprint 6.5
(Facilitator Authentication) in the Sprint 6 → Sprint 7 window.

**Timeline** (anchored to T0 = Sprint 6 merged, in business days, so it stays
pinned even if calendar dates move):

| When | Milestone | Owner |
|---|---|---|
| T0 | Sprint 6 merges → engage contractor; hand over manifest, production URL, a test deck, and this checklist | us |
| T0 + 3 | Contractor provisions an unrestricted M365 tenant and side-loads the manifest | contractor |
| T0 + 5 | Host verification run (checklist below); issues filed as GitHub issues | contractor |
| T0 + 7 | Fixes (if any) landed and re-verified | us + contractor |
| T0 + 8 | Signed-off verification report attached here; gate lifted → Sprint 7 may start | us |

If any milestone slips, note the reason and a new date in this section the same
day — do not let it pass silently.

**Verification checklist (real host):**

- Sprint 0 — ribbon tab + "Open Task Pane" button appear; task pane renders; the
  Supabase status pill turns green.
- Sprint 1 — "Link current slide" captures the selected slide id; slide_links rows
  are written.
- Sprint 5 — advancing slides moves the presenter context; full Launch → Close →
  Reveal → Hide cycle works without leaving PowerPoint.

**Exit criteria:** all checklist items pass (or are waived in writing here), the
report is linked, and the Sprint 7 gate is explicitly lifted above.

## Scheduled sprint insertions

### Sprint 6.5 — Facilitator Authentication (before Sprint 7)

Replace the temporary anonymous-session bootstrap with a real facilitator
sign-in. Runs after Sprint 6 (AI Insights) and before Sprint 7 (Reporting), so
exports and the session archive are tied to authenticated facilitator accounts.

Scope:

- Email (magic-link) and/or OAuth sign-in via Supabase Auth + `@supabase/ssr`.
- Sign-in / sign-out UI on `/addin` and `/dashboard`; gate authoring and
  sessions behind an authenticated user.
- Migrate any data created under anonymous sessions, or require sign-in before
  first authoring.
- Remove `lib/supabase/ensure-session.ts` (the anonymous bootstrap) once real
  auth lands; keep RLS unchanged (`owner_id = auth.uid()` still holds).

## From Sprint 1 (Poll Authoring)

- **Facilitator auth is a temporary anonymous bootstrap.** `lib/supabase/ensure-session.ts`
  signs the facilitator in anonymously so RLS (`owner_id = auth.uid()`) works,
  because the sprint sequence has no login surface yet. This requires **Anonymous
  sign-ins** to be enabled in Supabase (Authentication → Providers). Replaced by
  Sprint 6.5 (above) before V1 ship.
- **Single implicit workshop per facilitator.** `getOrCreateDefaultWorkshopId`
  creates one "My Workshop" per user. A real workshop selector / multi-workshop
  UI arrives with the Facilitator OS (Sprint 8).
- **`types/database.ts` is hand-authored** to match `supabase/migrations`. Once
  the Supabase CLI can reach the project, regenerate with
  `supabase gen types typescript` and delete the hand-maintained note.
- **supabase-js / ssr version pin.** `@supabase/ssr` was bumped to 0.12 to match
  the `SupabaseClient` generics in `@supabase/supabase-js` 2.108; older ssr made
  typed inserts resolve to `never`. Keep these two in lockstep on future bumps.

## Verification still owed (blocked by the sandbox network allowlist)

Sprint 1:

- Live create/read/update/delete of each question type against Supabase.
- Confirm RLS blocks cross-facilitator reads.
- Confirm `slide_links` is written when a slide is selected in PowerPoint.

Sprint 2:

- Create a session; confirm `session_code` is unique and 6 chars.
- Scan the QR; confirm it resolves to `/join/[code]`.
- Start then end a session; confirm `status` transitions draft → active → ended.
- Confirm `check_session_code` returns a row only for an active code (anon role).

Sprint 3:

- Join from a phone; submit one response of each type; confirm rows in `responses`.
- Load test ~50 concurrent submissions (k6/autocannon) against `/api/responses`.
- Confirm a participant cannot submit to a non-active session (409) or without the
  join cookie (401).
- Requires `SUPABASE_SERVICE_ROLE_KEY` set in the deployment (participant flows
  use the service-role admin client server-side).

Sprint 4:

- Open `/addin` (or `/dashboard`) and a participant tab; submit a response and
  confirm the visualization updates in under 1 second (`console.time`).
- Stress with ~50 rapid submissions; confirm charts keep up.
- Requires Realtime enabled: migration `0004` adds `responses` to the
  `supabase_realtime` publication. Confirm the facilitator only receives
  responses for their own sessions (RLS on the Realtime subscription).

Sprint 5:

- In PowerPoint, advance slides and confirm the task pane follows the linked
  question (slide-change handler).
- Run a full Launch → Close → Reveal → Hide cycle without leaving PowerPoint.
- Confirm Launch opens exactly one question (others close) and the participant
  view follows the open question; Reveal shows results to participants.
- Slide-change + four controls can only be exercised inside the PowerPoint host.
