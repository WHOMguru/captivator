// Pure aggregation of raw response payloads into chart-ready shapes. Payloads
// are validated on write (POST /api/responses), so here we read defensively but
// don't re-validate.

export type ResponseRow = {
  id: string;
  payload: unknown;
  submitted_at: string;
};

function asRecord(payload: unknown): Record<string, unknown> {
  return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
}

export type Tally = { label: string; count: number };

export function tallyMultipleChoice(options: string[], rows: ResponseRow[]): Tally[] {
  const counts = new Map<string, number>(options.map((o) => [o, 0]));
  for (const row of rows) {
    const selected = asRecord(row.payload).selected;
    if (Array.isArray(selected)) {
      for (const option of selected) {
        if (typeof option === 'string' && counts.has(option)) {
          counts.set(option, (counts.get(option) ?? 0) + 1);
        }
      }
    }
  }
  return options.map((option) => ({ label: option, count: counts.get(option) ?? 0 }));
}

export function tallyWords(rows: ResponseRow[]): Tally[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const words = asRecord(row.payload).words;
    if (Array.isArray(words)) {
      for (const word of words) {
        if (typeof word === 'string' && word.trim()) {
          const key = word.trim();
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
      }
    }
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export type FeedEntry = { id: string; text: string; submittedAt: string };

export function openTextFeed(rows: ResponseRow[]): FeedEntry[] {
  return rows
    .map((row) => ({
      id: row.id,
      text:
        typeof asRecord(row.payload).text === 'string'
          ? (asRecord(row.payload).text as string)
          : '',
      submittedAt: row.submitted_at,
    }))
    .filter((entry) => entry.text.length > 0)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

// Borda count: in a ranking of N items, position i earns (N - 1 - i) points.
export function bordaRanking(items: string[], rows: ResponseRow[]): Tally[] {
  const scores = new Map<string, number>(items.map((i) => [i, 0]));
  for (const row of rows) {
    const order = asRecord(row.payload).order;
    if (Array.isArray(order)) {
      order.forEach((item, index) => {
        if (typeof item === 'string' && scores.has(item)) {
          scores.set(item, (scores.get(item) ?? 0) + (order.length - 1 - index));
        }
      });
    }
  }
  return [...scores.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}
