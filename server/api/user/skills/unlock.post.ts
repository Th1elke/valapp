import { eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { userSkills, users } from '~~/db/schema'
import { DEMO_USER_ID } from '#shared/constants'
import { getAvailableSP } from '#shared/gamification'
import { getPrerequisiteSkillId, getSkill } from '#shared/skills'
import type { UserStateDTO } from '#shared/types'

export default defineEventHandler(async (event): Promise<UserStateDTO> => {
  const body = await readBody(event)
  const skillId = body?.skillId
  const skill = typeof skillId === 'string' ? getSkill(skillId) : undefined
  if (!skill) throw createError({ statusCode: 400, statusMessage: 'Habilidade inválida.' })

  return db.transaction((tx): UserStateDTO => {
    const user = tx.select().from(users).where(eq(users.id, DEMO_USER_ID)).get()
    if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário demo não encontrado.' })
    if (user.playerClass !== skill.playerClass) {
      throw createError({ statusCode: 400, statusMessage: 'Essa habilidade não é da sua classe.' })
    }

    const owned = getUnlockedSkillIds(tx, DEMO_USER_ID)
    if (owned.includes(skill.id)) throw createError({ statusCode: 400, statusMessage: 'Você já tem essa habilidade.' })

    const prerequisite = getPrerequisiteSkillId(skill)
    if (prerequisite && !owned.includes(prerequisite)) {
      throw createError({ statusCode: 400, statusMessage: 'Você precisa da habilidade do tier anterior nesse caminho primeiro.' })
    }

    const availableSP = getAvailableSP(user.level, owned.length)
    if (availableSP < skill.cost) throw createError({ statusCode: 400, statusMessage: 'Pontos de habilidade insuficientes.' })

    tx.insert(userSkills).values({ userId: DEMO_USER_ID, skillId: skill.id }).run()

    const updated = tx.select().from(users).where(eq(users.id, DEMO_USER_ID)).get()!
    return toUserStateDTO(updated, tx)
  })
})
