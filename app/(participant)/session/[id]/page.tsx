import { ParticipantSession } from '@/components/participant/ParticipantSession';

// Active participant session view. Mobile-first, no Office.js. Polls for the
// session's questions (Sprint 4 swaps polling for a realtime subscription).
export default function SessionPage({ params }: { params: { id: string } }) {
  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-8">
      <header className="mb-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-captivator-accent">
          Captivator
        </p>
      </header>
      <ParticipantSession sessionId={params.id} />
    </main>
  );
}
