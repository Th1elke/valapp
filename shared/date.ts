/** Isomorphic date-string helpers (client + server) — local calendar date, not UTC. */
export function toDateStr(date: Date): string {
  const tzOffsetMs = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 10)
}

export function todayStr(): string {
  return toDateStr(new Date())
}
