import type { HabitFrequency } from './types'

/** Index matches JS `Date#getDay()` (0 = domingo … 6 = sábado). */
export const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const

/** Weekday (0-6) of a "YYYY-MM-DD" string, computed in local time (never shifts a day via UTC parsing). */
export function dateWeekday(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y!, m! - 1, d!).getDay()
}

/**
 * Whether a habit is expected on a given date. `diaria`/`semanal` are always scheduled (semanal's
 * flexible "N times this week" mode isn't implemented yet, so it falls back to daily-like behavior
 * rather than silently never counting). Only `dias_customizados` actually gates by weekday.
 */
export function isHabitScheduled(frequency: HabitFrequency, customDays: number[] | null | undefined, dateStr: string): boolean {
  if (frequency !== 'dias_customizados') return true
  if (!customDays || customDays.length === 0) return true
  return customDays.includes(dateWeekday(dateStr))
}

/** Short label for a set of custom days, e.g. "Sáb, Dom". */
export function customDaysLabel(customDays: number[] | null | undefined): string {
  if (!customDays || customDays.length === 0) return ''
  return [...customDays]
    .sort((a, b) => a - b)
    .map((d) => WEEKDAY_LABELS[d])
    .join(', ')
}
