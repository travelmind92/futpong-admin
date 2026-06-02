const MATCHDAY_CYCLE = ['+1', '+2', '+3', '-2', '-1'] as const;

/** Matchday label for a 1-based training day index (cycles every 5 days). */
export function matchdayForDay(day: number): string {
  if (!Number.isFinite(day) || day < 1) {
    return '+1';
  }
  const r = (day - 1) % 5;
  return MATCHDAY_CYCLE[r];
}
