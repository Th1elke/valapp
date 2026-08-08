import type { UserStateDTO } from '#shared/types'

export function unlockSkill(skillId: string) {
  return $fetch<UserStateDTO>('/api/user/skills/unlock', { method: 'POST', body: { skillId } })
}
