import type { InventoryItemId } from '#shared/economy'
import type { PlayerClass, UserStateDTO } from '#shared/types'

export interface DevInjectPayload {
  xp?: number
  level?: number
  hp?: number
  gold?: number
  shieldsRemaining?: number
  playerClass?: PlayerClass | null
  setSkills?: string[]
  inventory?: Partial<Record<InventoryItemId, number>>
}

export function devInject(payload: DevInjectPayload) {
  return $fetch<UserStateDTO>('/api/dev/inject', { method: 'POST', body: payload })
}
