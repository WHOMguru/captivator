import Link from 'next/link';

// Public landing page. Intentionally free of any Office.js or facilitator code so
// the root bundle stays small and never pulls in the add-in runtime.
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-captivator-accent">
          Captivator
        </p>
        <h1 className="text-3xl font-bold text-slate-900">
          PowerPoint-native audience engagement.
        </h1>
        <p className="text-base text-slate-600">
          Author polls, run live sessions, and generate AI insights without leaving PowerPoint.
          Participants join from any phone.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/dashboard"
          className="rounded-md bg-captivator-accent px-4 py-2 font-medium text-white transition hover:opacity-90"
        >
          Facilitator dashboard
        </Link>
        <Link
          href="/addin"
          className="rounded-md border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Open the task pane
        </Link>
      </div>
    </main>
  );
}
