export function toDateStr(date: Date): string {
  const tzOffsetMs = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 10)
}

export function todayStr(): string {
  return toDateStr(new Date())
}

export function yesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return toDateStr(d)
}
