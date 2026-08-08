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

export function uploadAvatar(file: File) {
  const body = new FormData()
  body.append('avatar', file)
  return $fetch<UserStateDTO>('/api/user/avatar', { method: 'POST', body })
}

export function updateUserName(name: string) {
  return $fetch<UserStateDTO>('/api/user/name', { method: 'POST', body: { name } })
}

export function uploadCover(file: File) {
  const body = new FormData()
  body.append('cover', file)
  return $fetch<UserStateDTO>('/api/user/cover', { method: 'POST', body })
}
