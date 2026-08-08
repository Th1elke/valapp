import type { GrimoireAnswerResultDTO, GrimoireSessionDTO } from '#shared/types'

export function useGrimoireHistory() {
  return useFetch<GrimoireSessionDTO[]>('/api/grimoire', { key: 'grimoire-history' })
}

export function createGrimoireSession(content: string, useElixir?: boolean) {
  return $fetch<GrimoireSessionDTO>('/api/grimoire', { method: 'POST', body: { content, useElixir } })
}

export function fetchGrimoireSession(id: string) {
  return $fetch<GrimoireSessionDTO>(`/api/grimoire/${id}`)
}

export function answerGrimoireQuestion(id: string, questionIndex: number, selectedOption: number) {
  return $fetch<GrimoireAnswerResultDTO>(`/api/grimoire/${id}/answer`, {
    method: 'POST',
    body: { questionIndex, selectedOption },
  })
}

export function revealGrimoireHint(id: string, questionIndex: number) {
  return $fetch<{ eliminatedIndices: number[] }>(`/api/grimoire/${id}/reveal-hint`, {
    method: 'POST',
    body: { questionIndex },
  })
}
