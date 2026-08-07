import type { HabitDifficulty, MissionDTO } from '#shared/types'

export function useMissions() {
  return useFetch<MissionDTO[]>('/api/missions', { key: 'missions' })
}

export function createMission(input: { title: string; description?: string; difficulty: HabitDifficulty }) {
  return $fetch('/api/missions', { method: 'POST', body: input })
}

export function completeMission(id: string) {
  return $fetch<{ xp: number; gold: number; level: number; leveledUp: boolean }>(`/api/missions/${id}/complete`, {
    method: 'POST',
  })
}

export function cancelMission(id: string) {
  return $fetch(`/api/missions/${id}`, { method: 'DELETE' })
}
