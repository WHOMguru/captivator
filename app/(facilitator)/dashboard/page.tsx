import { SessionManager } from '@/components/presenter/SessionManager';

// Web mirror of the facilitator task pane. Sessions are managed here too; live
// results (Sprint 4) and reporting (Sprint 7) build on this surface.
export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Facilitator Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">
          Create and run sessions from the browser — a mirror of the PowerPoint task pane.
        </p>
      </header>
      <SessionManager />
    </main>
  );
}
