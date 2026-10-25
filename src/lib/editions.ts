import configuration from '../data/editions.json';
export type EditionId = 'classic' | 'tacustav-2026';
export const EDITION_STORAGE_KEY = 'wongo-edition';
export const editions = configuration;

/** Explicit QR/link choice wins. No timestamp or expiry is stored. */
export function resolveEdition(search: string, stored: string | null): EditionId {
  const requested = new URLSearchParams(search).get('edition');
  if (requested === 'classic' || requested === 'tacustav-2026') return requested;
  return stored === 'tacustav-2026' ? stored : 'classic';
}

export function readEdition(): EditionId {
  let stored: string | null = null;
  try { stored = localStorage.getItem(EDITION_STORAGE_KEY); } catch { /* The URL choice also works without storage. */ }
  return resolveEdition(location.search, stored);
}
