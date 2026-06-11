// Active participant session view. Mobile-first, no Office.js. Wired up in
// Sprint 3; realtime updates arrive in Sprint 4.
export default function SessionPage({ params }: { params: { id: string } }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Session</h1>
      <p className="text-sm text-slate-600">
        Session ID: <span className="font-mono">{params.id}</span>
      </p>
      <p className="text-xs text-slate-400">Response components ship in Sprint 3.</p>
    </main>
  );
}
