import type { GrimoireAnswerResultDTO, GrimoireSessionDTO } from '#shared/types'

export function useGrimoireHistory() {
  return useFetch<GrimoireSessionDTO[]>('/api/grimoire', { key: 'grimoire-history' })
}

export function createGrimoireSession(content: string) {
  return $fetch<GrimoireSessionDTO>('/api/grimoire', { method: 'POST', body: { content } })
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
