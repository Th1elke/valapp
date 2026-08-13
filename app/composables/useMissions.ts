import type { HabitCategory, HabitDifficulty, MissionDTO } from '#shared/types'

export function useMissions() {
  return useFetch<MissionDTO[]>('/api/missions', { key: 'missions' })
}

export function createMission(input: {
  title: string
  description?: string
  category?: HabitCategory | null
  difficulty?: HabitDifficulty | null
  deadline?: string | null
}) {
  return $fetch('/api/missions', { method: 'POST', body: input })
}

export function completeMission(id: string) {
  return $fetch<{ xpAwarded: number; goldAwarded: number; xp: number; gold: number; level: number; leveledUp: boolean }>(`/api/missions/${id}/complete`, {
    method: 'POST',
  })
}

export function cancelMission(id: string) {
  return $fetch(`/api/missions/${id}`, { method: 'DELETE' })
}

export function updateMissionDifficulty(id: string, difficulty: HabitDifficulty) {
  return $fetch(`/api/missions/${id}/difficulty`, { method: 'PATCH', body: { difficulty } })
}
