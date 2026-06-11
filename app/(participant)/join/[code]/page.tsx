import { AutoJoin } from '@/components/participant/AutoJoin';

// Participant join screen. Mobile-first and free of any Office.js import so the
// participant bundle stays lean. Joins anonymously, then routes to the session.
export default function JoinPage({ params }: { params: { code: string } }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <header className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-captivator-accent">
          Captivator
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Joining session</h1>
      </header>
      <AutoJoin code={params.code} />
    </main>
  );
}
