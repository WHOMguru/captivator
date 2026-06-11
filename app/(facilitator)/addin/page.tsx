'use client';

import { useEffect, useState } from 'react';

import { loadOffice } from '@/lib/office/loader';
import { createClient } from '@/lib/supabase/client';

import { StatusPill, type ConnectionState } from './components/status-pill';

export default function AddinPage() {
  const [supabaseState, setSupabaseState] = useState<ConnectionState>('connecting');
  const [officeState, setOfficeState] = useState<ConnectionState>('connecting');

  useEffect(() => {
    let active = true;

    // Supabase: the pill turns green once the browser client initializes and
    // can reach the auth endpoint.
    try {
      const supabase = createClient();
      supabase.auth
        .getSession()
        .then(() => active && setSupabaseState('connected'))
        .catch(() => active && setSupabaseState('error'));
    } catch {
      if (active) setSupabaseState('error');
    }

    // Office.js: green when the PowerPoint host signals ready. Outside the host
    // (e.g. a plain browser tab) this resolves once the CDN script loads.
    loadOffice()
      .then(() => active && setOfficeState('connected'))
      .catch(() => active && setOfficeState('error'));

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="flex flex-1 flex-col gap-6 p-5">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-captivator-accent">
          Captivator
        </p>
        <h1 className="text-2xl font-bold text-slate-900">Task Pane</h1>
        <p className="text-sm text-slate-600">
          Author polls, launch sessions, and read the room — without leaving PowerPoint.
        </p>
      </header>

      <section className="flex flex-wrap gap-2">
        <StatusPill label={`Supabase: ${supabaseState}`} state={supabaseState} />
        <StatusPill label={`Office.js: ${officeState}`} state={officeState} />
      </section>

      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
        Sprint 0 shell. Poll authoring arrives in Sprint 1.
      </section>
    </main>
  );
}
