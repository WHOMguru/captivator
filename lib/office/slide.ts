// PowerPoint slide helpers. Imported only under /addin (depends on Office.js).
// Slide ids are opaque strings — we read them and hand them to the database
// unchanged, never parsing or transforming them.
import { loadOffice } from './loader';

export type SlideSelection = {
  slideId: string;
  deckId: string | null;
};

/**
 * Returns the id of the slide currently selected in PowerPoint, or null when
 * nothing is selected or the host isn't PowerPoint (e.g. a plain browser tab).
 */
export async function getSelectedSlide(): Promise<SlideSelection | null> {
  await loadOffice();

  if (typeof PowerPoint === 'undefined') {
    return null;
  }

  return PowerPoint.run(async (context) => {
    const slides = context.presentation.getSelectedSlides();
    slides.load('items/id');
    await context.sync();

    const first = slides.items[0];
    if (!first) {
      return null;
    }

    // Office.context.document.url is the closest stable per-deck identifier the
    // JS API exposes; it may be empty for unsaved presentations.
    const deckId = window.Office?.context?.document?.url || null;
    return { slideId: first.id, deckId };
  }).catch(() => null);
}

/**
 * Subscribes to PowerPoint selection changes (which fire when the user moves to
 * a different slide) and invokes `onChange` with the newly selected slide.
 * Returns an unsubscribe function. No-ops outside the PowerPoint host.
 */
export async function subscribeToSlideChange(
  onChange: (selection: SlideSelection | null) => void,
): Promise<() => void> {
  await loadOffice();

  const doc = window.Office?.context?.document;
  if (!doc) {
    return () => undefined;
  }

  const handler = () => {
    void getSelectedSlide().then(onChange);
  };

  doc.addHandlerAsync(window.Office!.EventType.DocumentSelectionChanged, handler);

  return () => {
    doc.removeHandlerAsync(window.Office!.EventType.DocumentSelectionChanged, {
      handler,
    });
  };
}
