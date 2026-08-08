import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Same self-hosted font files the frontend ships (docs/09-design-system.md
// — no CDN dependency for a LAN app). Embedded as data URIs so Puppeteer
// doesn't need file:// access into node_modules at render time.
const FONT_FILES = {
  archivoBlack: '@fontsource/archivo-black/files/archivo-black-latin-400-normal.woff2',
  archivo700: '@fontsource/archivo/files/archivo-latin-700-normal.woff2',
  inter400: '@fontsource/inter/files/inter-latin-400-normal.woff2',
  inter500: '@fontsource/inter/files/inter-latin-500-normal.woff2',
  inter700: '@fontsource/inter/files/inter-latin-700-normal.woff2',
  jetbrainsMono500: '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2',
};

let cachedCss = null;

function toDataUri(pkgPath) {
  const bytes = readFileSync(require.resolve(pkgPath));
  return `data:font/woff2;base64,${bytes.toString('base64')}`;
}

export function fontFaceCss() {
  if (cachedCss) return cachedCss;

  const uris = Object.fromEntries(Object.entries(FONT_FILES).map(([key, pkgPath]) => [key, toDataUri(pkgPath)]));

  cachedCss = `
    @font-face { font-family: 'Archivo Black'; src: url(${uris.archivoBlack}) format('woff2'); font-weight: 400; }
    @font-face { font-family: 'Archivo'; src: url(${uris.archivo700}) format('woff2'); font-weight: 700; }
    @font-face { font-family: 'Inter'; src: url(${uris.inter400}) format('woff2'); font-weight: 400; }
    @font-face { font-family: 'Inter'; src: url(${uris.inter500}) format('woff2'); font-weight: 500; }
    @font-face { font-family: 'Inter'; src: url(${uris.inter700}) format('woff2'); font-weight: 700; }
    @font-face { font-family: 'JetBrains Mono'; src: url(${uris.jetbrainsMono500}) format('woff2'); font-weight: 500; }
  `;
  return cachedCss;
}
