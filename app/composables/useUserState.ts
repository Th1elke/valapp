import type { DailyClosureResultDTO, PlayerClass, UserStateDTO } from '#shared/types'

export function useUserState() {
  return useFetch<UserStateDTO>('/api/user', { key: 'user' })
}

export function chooseClass(playerClass: PlayerClass) {
  return $fetch('/api/user/class', { method: 'POST', body: { playerClass } })
}

export function runDailyClosure(date?: string) {
  return $fetch<DailyClosureResultDTO>('/api/daily-closure', { method: 'POST', body: date ? { date } : {} })
}
