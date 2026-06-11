import 'server-only';

import { createClient } from '@/lib/supabase/server';

// Infer the concrete client type from our server factory rather than
// hand-writing SupabaseClient generics, which drift across supabase-js versions.
type ServerClient = ReturnType<typeof createClient>;

const DEFAULT_WORKSHOP_TITLE = 'My Workshop';

/**
 * Returns the facilitator's default workshop id, creating one on first use.
 * V1 keeps a single implicit workshop per facilitator; the workshop selector
 * arrives with the Facilitator OS in Sprint 8.
 */
export async function getOrCreateDefaultWorkshopId(
  supabase: ServerClient,
  ownerId: string,
): Promise<string> {
  const { data: existing, error: selectError } = await supabase
    .from('workshops')
    .select('id')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing.id;

  const { data: created, error: insertError } = await supabase
    .from('workshops')
    .insert({ owner_id: ownerId, title: DEFAULT_WORKSHOP_TITLE })
    .select('id')
    .single();

  if (insertError) throw insertError;
  return created.id;
}
