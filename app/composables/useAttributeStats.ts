import type { AttributeStatsDTO } from '#shared/types'

export function useAttributeStats() {
  return useFetch<AttributeStatsDTO[]>('/api/user/stats', { key: 'attribute-stats' })
}
