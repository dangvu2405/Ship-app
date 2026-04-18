/**
 * Client helpers for the US NHTSA vPIC public API (vehicle makes and models).
 *
 * @see https://vpic.nhtsa.dot.gov/api/
 */

export interface VpicMakeRow {
  readonly Make_ID?: number;
  readonly Make_Name: string;
}

export interface VpicModelRow {
  readonly Make_Name?: string;
  readonly Model_Name: string;
}

interface VpicEnvelope<T> {
  readonly Results?: T[];
}

/**
 * Resolves the API origin used by the browser.
 * In development, defaults to `/vpic` so Vite can proxy and avoid CORS issues.
 */
export function getVpicBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_VPIC_BASE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  if (import.meta.env.DEV) {
    return '/vpic';
  }
  return 'https://vpic.nhtsa.dot.gov';
}

function joinVpicPath(path: string): string {
  const base = getVpicBaseUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

/**
 * Fetches the full list of vehicle makes from vPIC.
 */
export async function fetchVpicAllMakes(): Promise<VpicMakeRow[]> {
  const res = await fetch(joinVpicPath('/api/vehicles/getallmakes?format=json'));
  if (!res.ok) {
    throw new Error(`VPIC getallmakes failed: ${res.status}`);
  }
  const body = (await res.json()) as VpicEnvelope<VpicMakeRow>;
  return Array.isArray(body.Results) ? body.Results : [];
}

/**
 * Fetches model names for a given make (e.g. `Toyota`).
 */
export async function fetchVpicModelsForMake(makeName: string): Promise<string[]> {
  const q = makeName.trim();
  if (!q) {
    return [];
  }
  const segment = encodeURIComponent(q);
  const res = await fetch(joinVpicPath(`/api/vehicles/getmodelsformake/${segment}?format=json`));
  if (!res.ok) {
    throw new Error(`VPIC getmodelsformake failed: ${res.status}`);
  }
  const body = (await res.json()) as VpicEnvelope<VpicModelRow>;
  const rows = Array.isArray(body.Results) ? body.Results : [];
  const names = rows
    .map((r) => r.Model_Name?.trim())
    .filter((n): n is string => Boolean(n));
  return [...new Set(names)].sort((a, b) => a.localeCompare(b));
}
