// Generates a PowerPoint manifest pointing at a deployed origin by replacing
// every localhost reference in public/manifest.xml.
//
// Usage:
//   node scripts/gen-manifest.mjs https://your-app.vercel.app [outfile]
//
// Default outfile: public/manifest.vercel.xml
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const base = process.argv[2];
if (!base || !/^https:\/\//.test(base)) {
  console.error('Usage: node scripts/gen-manifest.mjs <https-base-url> [outfile]');
  console.error('The URL must be https:// — Office.js refuses mixed content.');
  process.exit(1);
}

const origin = base.replace(/\/+$/, '');
const src = fileURLToPath(new URL('../public/manifest.xml', import.meta.url));
const dest = process.argv[3] ?? 'public/manifest.vercel.xml';

const xml = readFileSync(src, 'utf8').replaceAll('https://localhost:3000', origin);
writeFileSync(dest, xml);

console.log(`Wrote ${dest} → task pane at ${origin}/addin`);
