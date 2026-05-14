/**
 * Test-data utilities for generating unique values in create/update flows.
 */

/** Returns a unique code string like "TESTDRIVER-1715702400000". */
export function uniqueCode(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

/** Returns a unique email like "testdriver-1715702400000@e2e.test". */
export function uniqueEmail(prefix: string): string {
  return `${prefix.toLowerCase()}-${Date.now()}@e2e.test`;
}

/** Returns a Vietnamese phone number that looks realistic but is unique. */
export function uniquePhone(): string {
  const suffix = String(Date.now()).slice(-7);
  return `090${suffix}`;
}

/** Today as YYYY-MM-DD string. */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
