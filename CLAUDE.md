# Captivator V1 — Claude Code Project Context

> Read this file at the start of every session. It is the durable contract for how this project is built.
> When in doubt, the master spec (`Captivator_Master_Dev_Spec_v2.docx`) is authoritative. This file is its operational summary.

---

## 1. What this project is

Captivator is a **PowerPoint-native audience engagement and facilitation platform**. The facilitator authors polls, runs live sessions, captures responses, and generates AI insights — all without ever leaving PowerPoint. A secondary mobile web experience lets participants join and respond.

- **Primary user:** Omar L. Harris.
- **Success metric:** A facilitator can run an entire workshop without leaving PowerPoint.
- **Core principle:** PowerPoint is the source of truth. Slide IDs are canonical; database rows reference slides, never the reverse.

---

## 2. Architecture (non-negotiable)

Captivator V1 is **one Next.js application**. Not a monorepo. Not workspaces. Not separate packages.

- Next.js 14+ with App Router.
- TypeScript strict mode (`noUncheckedIndexedAccess: true`).
- Tailwind CSS + shadcn/ui primitives.
- Supabase for Postgres, Realtime, and Auth.
- OpenAI `gpt-4o` with structured outputs for AI.
- Vercel for hosting. pnpm for packages.

**Route layout:**

| Route | Purpose | Notes |
|---|---|---|
| `/addin` | PowerPoint task pane | Dynamically imports Office.js |
| `/dashboard` | Facilitator web UI | Mirror of task pane for browser use |
| `/join/[code]` | Participant join screen | Mobile-first, no Office.js |
| `/session/[id]` | Participant active session | Mobile-first, no Office.js |
| `/api/*` | Route handlers | Sessions, responses, AI, exports |

**Hard rule:** Office.js is imported only inside `/addin` via `lib/office/loader.ts`. The participant bundle must not contain Office.js. Verify with `next build` and inspect chunks if unsure.

---

## 3. Repository structure

```
captivator/
├── app/
│   ├── (facilitator)/
│   │   ├── addin/                  # PowerPoint task pane
│   │   └── dashboard/              # Web mirror
│   ├── (participant)/
│   │   ├── join/[code]/
│   │   └── session/[id]/
│   ├── api/
│   │   ├── sessions/
│   │   ├── responses/
│   │   ├── ai/insights/
│   │   └── exports/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                         # shadcn primitives
│   ├── polls/                      # Authoring + response components
│   ├── results/                    # Visualizations
│   └── presenter/                  # Launch controls, dashboard
├── lib/
│   ├── supabase/                   # client.ts, server.ts, middleware.ts
│   ├── office/                     # loader.ts, slide.ts (NEVER import outside /addin)
│   ├── ai/                         # insights.ts
│   ├── realtime/                   # channels.ts (single source of channel names)
│   ├── schemas/                    # Zod schemas, shared by client + server
│   ├── templates/                  # Sprint 8 workshop template engine
│   └── utils.ts
├── types/
│   ├── database.ts                 # Generated via `supabase gen types`
│   ├── poll.ts
│   ├── session.ts
│   └── insight.ts
├── public/
│   ├── manifest.xml                # PowerPoint add-in manifest
│   └── assets/icons/
├── supabase/
│   ├── migrations/                 # Versioned SQL
│   └── seed.sql
├── CLAUDE.md                       # This file
├── .env.local.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Conventions

- **Schema changes are migrations.** Every change is a new file in `/supabase/migrations`. Never edit an old migration. After migration, regenerate `types/database.ts` via `supabase gen types typescript`.
- **RLS is mandatory at table creation.** A table without policies does not ship. Default: facilitators access only their own rows; participants access only the session they joined.
- **Zod schemas are shared.** Form validation and API validation use the same schema from `/lib/schemas`. One schema, two consumers.
- **Realtime channel names come from one place.** `lib/realtime/channels.ts` exports typed helpers (`sessionChannel(id)`, `questionChannel(id)`). Never hand-write channel strings elsewhere.
- **Server-only secrets stay server-only.** `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`. Never import them in a Client Component or expose them via `NEXT_PUBLIC_*`.
- **Server Components by default.** Reach for `"use client"` only when you need interactivity, state, or browser APIs.
- **PowerPoint slide IDs are strings.** Treat them as opaque. Office.js exposes them; database stores them; never parse or transform them.
- **`@supabase/ssr` for auth.** Not the older `@supabase/auth-helpers-nextjs`. Cookies are handled by `lib/supabase/server.ts`.

---

## 5. What not to do

- Do not introduce a monorepo, pnpm workspaces, Turborepo, Nx, or separate `/apps` packages. One repo, one project.
- Do not import from `lib/office/*` outside the `/addin` route tree. The participant bundle must never contain Office.js.
- Do not ship a table without RLS policies.
- Do not commit `.env.local`. If a new env var is needed, add it to `.env.local.example` with a placeholder.
- Do not invent table names, columns, or channel names. If a change is needed, propose a migration or update `lib/realtime/channels.ts`.
- Do not bypass Zod validation on API routes. Every payload is parsed.
- Do not edit an existing migration file. Add a new one.
- Do not hand-roll PowerPoint event listeners outside `lib/office/`. Centralize them there.

---

## 6. Sprint plan — all in scope for V1

All nine sprints (0 through 8) are V1 scope. Reporting and the Facilitator OS are not deferred.

| # | Name | Status | Goal |
|---|---|---|---|
| 0 | Foundation & Task Pane Shell | ☑ | Next.js bootstrapped, `/addin` loads in PowerPoint via side-loaded manifest |
| 1 | Poll Authoring | ☑ | Create MC, Word Cloud, Open Text, Ranking questions linked to slides |
| 2 | Session Management | ☑ | Create sessions, generate codes and QR, lifecycle states |
| 3 | Participant Experience | ☑ | Mobile join + submit, 50 concurrent users, no Office.js in bundle |
| 4 | Live Results | ☑ | Realtime visualizations with sub-second latency |
| 5 | Presentation Controls | ☐ | Launch / Close / Reveal / Hide from PowerPoint, no browser switching |
| 6 | AI Insights | ☐ | Themes, sentiment, summary, prompts in under 10s for 100 responses |
| 7 | Reporting | ☐ | One-click PDF + CSV exports, session archive |
| 8 | Facilitator Operating System | ☐ | Templates, discussion library, action items, facilitator notes |

**Mark sprints complete here as they merge.** Update the box (`☐` → `☑`) and add the merge date in a comment. This file is the running ledger.

<!-- Merge log: Sprint 0 (PR #1), Sprint 1 (PR #3), Sprint 2 (PR #4), Sprint 3 (PR #5), Sprint 4 (PR #6) — all merged 2026-06-11. -->

> Scheduled insertion: **Sprint 6.5 — Facilitator Authentication** runs after Sprint 6 and before Sprint 7. See `FOLLOWUPS.md`.

---

## 7. How to work in this repo

### Starting any task
1. Read the relevant section of the spec doc (`Captivator_Master_Dev_Spec_v2.docx`) for the current sprint.
2. Read existing code in the area you will touch. Match conventions before introducing new ones.
3. Run `pnpm typecheck` and `pnpm dev` to confirm the repo is in a clean state.

### Executing a sprint
1. Confirm the prior sprint is merged to `main` and working tree is clean.
2. Create a branch: `sprint/N-short-name`.
3. Implement to the sprint's acceptance criteria. Resist scope creep — additional ideas go to a `FOLLOWUPS.md`.
4. Run the verification steps from the spec. Report results explicitly in the PR description.
5. `pnpm typecheck && pnpm build` must pass.
6. Open PR, link to the sprint section of the spec, request review.

### Verification discipline
Verification is part of Definition of Done. A sprint is not complete until its verification steps have been executed and pass. If a verification step cannot be run (e.g., no PowerPoint available), say so explicitly rather than skipping silently.

### Writing prompts to yourself
When breaking a sprint into sub-tasks, prefer goal + acceptance criteria over step-by-step code instructions. Trust the repo conventions; specify outcomes.

### When the spec and the code disagree
The spec is authoritative for intent. The code is authoritative for current state. If they disagree on substance, surface it in the PR description — do not silently align one to the other.

---

## 8. Environment variables

All required vars must be documented in `.env.local.example`. Current set:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=             # server only

# OpenAI
OPENAI_API_KEY=                        # server only

# App
NEXT_PUBLIC_APP_URL=                   # full https URL, used by manifest.xml
```

When adding a new env var: update `.env.local.example`, document its purpose in the relevant sprint section, and confirm it is read only on the appropriate side (server vs. client).

---

## 9. PowerPoint add-in side-loading

- **Local dev:** `pnpm dev` serves on `http://localhost:3000`. Office requires HTTPS — use `next dev --experimental-https` or a tunnel (ngrok, cloudflared). Update `SourceLocation` in `public/manifest.xml` to the HTTPS URL of `/addin`.
- **Install in PowerPoint:** Insert → Get Add-ins → Upload My Add-in → select `manifest.xml`.
- **After manifest changes:** Remove and re-add the add-in. PowerPoint caches manifests aggressively.
- **Mixed content blocks Office.js.** Every URL referenced from the task pane must be HTTPS, including dev tunnels.

---

## 10. Tone and defaults

- Match the existing code style. Don't reformat unrelated files.
- Keep components small and single-purpose. Split before they cross ~200 lines.
- Comments explain *why*, not *what*. The code is the *what*.
- Error messages are user-facing copy. Write them with care, especially in the participant flow.
- The participant experience is mobile-first and may be the only Captivator surface most attendees ever see. Treat it accordingly.
