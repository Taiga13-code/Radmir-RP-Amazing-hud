const PREVIEW_PARAM = 'debug';

/**
 * Cohtml does not provide URLSearchParams, so parse location.search manually.
 * Keeping this dependency-free guarantees the HUD bundle can evaluate inside
 * the game engine even on older Cohtml builds.
 */
function readParam(name: string): string | null {
  const search = typeof window === 'undefined' ? '' : window.location?.search ?? '';
  const query = search.startsWith('?') ? search.slice(1) : search;

  if (query === '') {
    return null;
  }

  for (const part of query.split('&')) {
    if (part === '') {
      continue;
    }

    const separator = part.indexOf('=');
    const rawKey = separator === -1 ? part : part.slice(0, separator);
    const rawValue = separator === -1 ? '' : part.slice(separator + 1);

    let key = rawKey;
    try {
      key = decodeURIComponent(rawKey.replace(/\+/g, ' '));
    } catch {
      key = rawKey;
    }

    if (key !== name) {
      continue;
    }

    try {
      return decodeURIComponent(rawValue.replace(/\+/g, ' '));
    } catch {
      return rawValue;
    }
  }

  return null;
}

export function isBrowserPreview(): boolean {
  const debug = readParam(PREVIEW_PARAM);

  if (debug === '1') {
    return true;
  }

  if (debug === '0') {
    return false;
  }

  // Injected production bundle must never show preview-only UI.
  return import.meta.env.DEV;
}
