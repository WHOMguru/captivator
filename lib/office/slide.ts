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

/**
 * Inserts a text box with the poll prompt + join instructions onto the currently
 * selected slide, so the audience sees it on the projected deck. No-ops outside
 * the PowerPoint host. (The JS API can't add images, so the QR stays in the task
 * pane; the join URL + code go on the slide.)
 */
export async function insertTextOnCurrentSlide(text: string): Promise<void> {
  await loadOffice();
  if (typeof PowerPoint === 'undefined') return;

  await PowerPoint.run(async (context) => {
    const slides = context.presentation.getSelectedSlides();
    slides.load('items');
    await context.sync();

    const slide = slides.items[0];
    if (!slide) return;

    const textBox = slide.shapes.addTextBox(text, {
      left: 40,
      top: 40,
      width: 480,
      height: 160,
    });
    textBox.name = 'Captivator Poll';
    await context.sync();
  });
}
