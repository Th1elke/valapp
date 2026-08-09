/** Isomorphic date-string helpers (client + server) — local calendar date, not UTC. */
export function toDateStr(date: Date): string {
  const tzOffsetMs = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 10)
}

export function todayStr(): string {
  return toDateStr(new Date())
}

/** Monday of the week containing `dateStr` (defaults to today), as YYYY-MM-DD — used for the weekly shield renewal (docs 5.2). */
export function weekStartStr(dateStr: string = todayStr()): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const daysSinceMonday = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - daysSinceMonday)
  return toDateStr(date)
}
