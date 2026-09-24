// =============================================================================
// Deterministic ID + PRNG utilities for seed data generation
// MOCK-DATA.md: "Write small deterministic generator functions...seed with a
// fixed constant so output is stable."
// =============================================================================

/** Simple mulberry32 PRNG — fast, seedable, good distribution */
export function createPRNG(seed: number) {
  let s = seed;
  return function next(): number {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick `count` unique items from `arr` using the given PRNG */
export function pickUnique<T>(arr: T[], count: number, rng: () => number): T[] {
  const pool = [...arr];
  const result: T[] = [];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(rng() * (pool.length - i));
    result.push(pool[idx]);
    pool[idx] = pool[pool.length - 1 - i];
  }
  return result;
}

/** Deterministic ID generator based on prefix + counter */
export function makeId(prefix: string, index: number): string {
  return `${prefix}-${String(index).padStart(4, '0')}`;
}

/** ISO date string some months before or after a reference date */
export function monthOffset(base: Date, months: number): string {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

/** Format a Date as "Month YYYY" */
export function periodLabel(date: Date): string {
  return date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

/** Add N months to a date string */
export function addMonths(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + n);
  return d.toISOString();
}

/** Random choice from array */
export function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Range [start, end) integers */
export function range(start: number, end: number): number[] {
  return Array.from({ length: end - start }, (_, i) => i + start);
}
