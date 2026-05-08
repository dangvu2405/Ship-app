/**
 * Vietnam administrative divisions via provinces.open-api.vn (open API).
 *
 * @see https://github.com/kenzouno123/EmbededData-VietNamAdministration
 */

const BASE = 'https://provinces.open-api.vn/api';

const canUseRemoteCatalog = (): boolean => {
  if (typeof window === 'undefined') return true;
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (!isLocal) return true;
  return import.meta.env.VITE_ENABLE_VN_OPEN_API === 'true';
};

export interface VnProvinceSummary {
  readonly name: string;
  readonly code: number;
  readonly division_type?: string;
  readonly codename?: string;
}

export interface VnDistrictSummary {
  readonly name: string;
  readonly code: number;
  readonly province_code?: number;
  readonly division_type?: string;
}

export interface VnWardSummary {
  readonly name: string;
  readonly code: number;
  readonly district_code?: number;
  readonly division_type?: string;
}

export interface VnProvinceWithDistricts extends VnProvinceSummary {
  readonly districts: VnDistrictSummary[];
}

export interface VnDistrictWithWards extends VnDistrictSummary {
  readonly wards: VnWardSummary[];
}

/**
 * Lists all provinces / centrally governed cities (shallow; districts omitted or empty).
 */
export async function fetchVnProvinceList(): Promise<VnProvinceSummary[]> {
  if (!canUseRemoteCatalog()) {
    return [];
  }
  const res = await fetch(`${BASE}/p/`, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`provinces.open-api.vn: ${res.status}`);
  }
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) {
    throw new Error('provinces.open-api.vn: invalid province list');
  }
  return data as VnProvinceSummary[];
}

/**
 * Loads one province and its districts (`depth=2`).
 */
export async function fetchVnProvinceWithDistricts(code: number): Promise<VnProvinceWithDistricts> {
  if (!canUseRemoteCatalog()) {
    return { code, name: String(code), districts: [] };
  }
  const res = await fetch(`${BASE}/p/${code}?depth=2`, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`provinces.open-api.vn province ${code}: ${res.status}`);
  }
  return (await res.json()) as VnProvinceWithDistricts;
}

/**
 * Loads one district / county and its wards (`depth=2`).
 */
export async function fetchVnDistrictWithWards(code: number): Promise<VnDistrictWithWards> {
  if (!canUseRemoteCatalog()) {
    return { code, name: String(code), wards: [] };
  }
  const res = await fetch(`${BASE}/d/${code}?depth=2`, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`provinces.open-api.vn district ${code}: ${res.status}`);
  }
  return (await res.json()) as VnDistrictWithWards;
}
