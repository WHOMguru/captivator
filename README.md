# Captivator V1

PowerPoint-native audience engagement and facilitation. Built as a unified Next.js application.

See **CLAUDE.md** for project context and conventions, and the master spec doc
(`Captivator_Master_Dev_Spec_v2.docx`) for the full sprint plan.

## Getting started

```bash
pnpm install
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
pnpm dev
```

Open https://localhost:3000.

## Side-loading the add-in

Office add-ins require HTTPS. `pnpm dev` runs Next.js with `--experimental-https`,
which serves a self-signed cert on `https://localhost:3000`.

### Local development

1. `pnpm dev`
2. Open PowerPoint desktop.
3. Insert → Get Add-ins → Upload My Add-in → select `public/manifest.xml`.
4. The **Captivator** ribbon tab appears. Click **Open Task Pane**.

After editing `manifest.xml`, remove and re-add the add-in. PowerPoint caches
manifests aggressively.

### Vercel / production

1. Each PR creates a Vercel preview URL.
2. Copy `public/manifest.xml`, replace every occurrence of `https://localhost:3000`
   with your preview URL, and side-load the modified copy.
3. Production manifest points at the production domain. Distribute via Microsoft 365
   admin center or AppSource.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Next.js dev server with HTTPS |
| `pnpm dev:http` | Plain HTTP (no add-in side-loading) |
| `pnpm build` | Production build |
| `pnpm start` | Production server (after build) |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript check (`tsc --noEmit`) |
| `pnpm format` | Prettier write |

## What ships in Sprint 0

- Next.js 14 App Router + TypeScript strict + Tailwind.
- `/addin` route with the task pane shell and Supabase + Office.js status pills.
- `lib/supabase/{client,server,middleware}.ts` using `@supabase/ssr`.
- `lib/office/loader.ts` — dynamic Office.js loader.
- `public/manifest.xml` — PowerPoint add-in manifest with a custom ribbon tab.
- Empty placeholder routes for `/dashboard`, `/join/[code]`, `/session/[id]`.
- `/api/health` route for sanity checks.

## Next sprint

Sprint 1: Poll Authoring. See the master spec doc for the verbatim Claude Code prompt.

