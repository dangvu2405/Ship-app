/**
 * Helpers for Vietnam admin address fields on Ant Design forms (provinces.open-api.vn).
 * Field names: `${prefix}addr_province_code`, … with `prefix` '' or `'start_'` / `'end_'`.
 */

export const vnAddressFormFieldNames = (fieldPrefix: string): readonly string[] => {
  const p = fieldPrefix;
  return [
    `${p}addr_province_code`,
    `${p}addr_province_name`,
    `${p}addr_district_code`,
    `${p}addr_district_name`,
    `${p}addr_ward_code`,
    `${p}addr_ward_name`,
    `${p}addr_street_detail`,
  ] as const;
};

export const composeVnAddressLine = (
  values: Record<string, unknown>,
  fieldPrefix: string,
): string | undefined => {
  const p = fieldPrefix;
  const street = String(values[`${p}addr_street_detail`] ?? '').trim();
  const ward = String(values[`${p}addr_ward_name`] ?? '').trim();
  const district = String(values[`${p}addr_district_name`] ?? '').trim();
  const province = String(values[`${p}addr_province_name`] ?? '').trim();
  if (!street || !ward || !district || !province) {
    return undefined;
  }
  return [street, ward, district, province].join(', ');
};

export const stripVnAddressFormKeys = (payload: Record<string, unknown>, fieldPrefix: string): void => {
  for (const k of vnAddressFormFieldNames(fieldPrefix)) {
    delete payload[k];
  }
};

/**
 * Writes composed line to `outputKey`, removes helper keys from `payload`.
 */
export const mergeVnAddressIntoPayload = (
  payload: Record<string, unknown>,
  rawValues: Record<string, unknown>,
  fieldPrefix: string,
  outputKey: string,
): void => {
  const composed = composeVnAddressLine(rawValues, fieldPrefix);
  stripVnAddressFormKeys(payload, fieldPrefix);
  if (composed) {
    payload[outputKey] = composed;
  }
};
