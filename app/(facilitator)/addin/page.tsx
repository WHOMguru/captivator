'use client';

import { useEffect, useState } from 'react';

import { PollAuthoring } from '@/components/polls/PollAuthoring';
import { PresenterDashboard } from '@/components/presenter/PresenterDashboard';
import { SessionManager } from '@/components/presenter/SessionManager';
import { authedFetch } from '@/lib/api';
import { loadOffice } from '@/lib/office/loader';
import {
  getSelectedSlide,
  insertTextOnCurrentSlide,
  subscribeToSlideChange,
} from '@/lib/office/slide';
import { createClient } from '@/lib/supabase/client';
import { getAccessToken } from '@/lib/supabase/ensure-session';

import { StatusPill, type ConnectionState } from './components/status-pill';

export default function AddinPage() {
  const [supabaseState, setSupabaseState] = useState<ConnectionState>('connecting');
  const [officeState, setOfficeState] = useState<ConnectionState>('connecting');
  const [authState, setAuthState] = useState<ConnectionState>('connecting');
  const [authLabel, setAuthLabel] = useState('Auth: …');

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

    // Auth diagnostic: runs the full client→server handshake so we can see
    // exactly where facilitator auth breaks inside the add-in webview.
    (async () => {
      try {
        const token = await getAccessToken();
        if (!active) return;
        if (!token) {
          setAuthState('error');
          setAuthLabel('Auth: no token (sign-in failed)');
          return;
        }
        const res = await authedFetch('/api/whoami');
        const body = (await res.json().catch(() => null)) as { userId?: string | null } | null;
        if (!active) return;
        if (body?.userId) {
          setAuthState('connected');
          setAuthLabel(`Auth: ${body.userId.slice(0, 8)}`);
        } else {
          setAuthState('error');
          setAuthLabel('Auth: token sent, server 401');
        }
      } catch {
        if (active) {
          setAuthState('error');
          setAuthLabel('Auth: request failed');
        }
      }
    })();

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
        <StatusPill label={authLabel} state={authState} />
      </section>

      {/* Flow: spin up a session room first, then fill it with polls, then present. */}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Sessions
        </h2>
        <SessionManager />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Polls</h2>
        {/* getSelectedSlide reads the PowerPoint selection; passing it here keeps
            Office.js imports inside the /addin tree. */}
        <PollAuthoring onPickSlide={getSelectedSlide} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Present
        </h2>
        {/* Office slide helpers are injected here so the shared presenter
            component never imports lib/office/* directly. */}
        <PresenterDashboard
          getCurrentSlide={async () => {
            const slide = await getSelectedSlide();
            return slide ? { slideId: slide.slideId } : null;
          }}
          subscribeSlide={(onChange) =>
            subscribeToSlideChange((slide) => onChange(slide ? slide.slideId : null))
          }
          onInsertOnSlide={insertTextOnCurrentSlide}
        />
      </section>
    </main>
  );
}
