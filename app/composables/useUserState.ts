import type { DailyClosureResultDTO, PlayerClass, ShieldTargetType, UserStateDTO } from '#shared/types'

export function useUserState() {
  return useFetch<UserStateDTO>('/api/user', { key: 'user' })
}

export function chooseClass(playerClass: PlayerClass) {
  return $fetch<UserStateDTO>('/api/user/class', { method: 'POST', body: { playerClass } })
}

export function useShield(targetType: ShieldTargetType, opts?: { habitId?: string; date?: string }) {
  return $fetch<UserStateDTO>('/api/user/shield', {
    method: 'POST',
    body: { targetType, habitId: opts?.habitId, date: opts?.date },
  })
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

export function syncGoogleClassroom() {
  return $fetch<{ imported: number; skipped: number }>('/api/user/google/sync', { method: 'POST' })
}

export function unlinkGoogle() {
  return $fetch('/api/user/google/unlink', { method: 'POST' })
}
