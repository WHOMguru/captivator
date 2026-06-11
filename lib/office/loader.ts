// Dynamic Office.js loader.
//
// HARD RULE (see CLAUDE.md): this module must NEVER be imported outside the
// `/addin` route tree. Office.js is injected from the Microsoft CDN at runtime
// rather than bundled, so the participant bundle stays free of it.

const OFFICE_JS_URL = 'https://appsforoffice.microsoft.com/lib/1/hosted/office.js';

declare global {
  interface Window {
    Office?: typeof Office;
  }
}

let officeReady: Promise<typeof Office> | null = null;

/**
 * Loads Office.js (once) and resolves when the host signals it is ready.
 * Rejects when run outside a browser or if the script fails to load.
 */
export function loadOffice(): Promise<typeof Office> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Office.js can only be loaded in the browser.'));
  }

  if (officeReady) {
    return officeReady;
  }

  officeReady = new Promise<typeof Office>((resolve, reject) => {
    const onReady = () => {
      if (!window.Office) {
        reject(new Error('Office.js loaded but window.Office is undefined.'));
        return;
      }
      window.Office.onReady(() => resolve(window.Office as typeof Office));
    };

    // The host (PowerPoint web/desktop) may have already injected Office.js.
    if (window.Office) {
      onReady();
      return;
    }

    const script = document.createElement('script');
    script.src = OFFICE_JS_URL;
    script.async = true;
    script.onload = onReady;
    script.onerror = () => reject(new Error('Failed to load Office.js from the Microsoft CDN.'));
    document.head.appendChild(script);
  });

  return officeReady;
}
