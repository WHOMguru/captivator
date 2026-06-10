// Participant join screen. Mobile-first, and deliberately free of any Office.js
// import so the participant bundle stays lean. Wired up in Sprint 3.
export default function JoinPage({ params }: { params: { code: string } }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Join session</h1>
      <p className="text-sm text-slate-600">
        Session code: <span className="font-mono font-semibold uppercase">{params.code}</span>
      </p>
      <p className="text-xs text-slate-400">Participant experience ships in Sprint 3.</p>
    </main>
  );
}
