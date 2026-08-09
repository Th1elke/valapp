import type { HabitCategory, HabitDifficulty, HabitDTO, HabitFrequency, HabitStatus } from '#shared/types'

export function useHabits() {
  return useFetch<HabitDTO[]>('/api/habits', { key: 'habits' })
}

export function createHabit(input: {
  name: string
  category: HabitCategory
  difficulty: HabitDifficulty
  frequency?: HabitFrequency
  customDays?: number[]
  weeklyTarget?: number
}) {
  return $fetch('/api/habits', { method: 'POST', body: input })
}

export function checkinHabit(id: string) {
  return $fetch<{ xpAwarded: number; streak: number; xp: number; level: number; leveledUp: boolean }>(
    `/api/habits/${id}/checkin`,
    { method: 'POST' },
  )
}

export function undoCheckin(id: string) {
  return $fetch(`/api/habits/${id}/checkin`, { method: 'DELETE' })
}

export function setHabitStatus(id: string, status: HabitStatus, pausedUntil?: string | null) {
  return $fetch(`/api/habits/${id}`, { method: 'PATCH', body: { status, pausedUntil } })
}
