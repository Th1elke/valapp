import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { grimoireSessions, userInventory } from '~~/db/schema'
import { GRIMOIRE_MAX_LENGTH, GRIMOIRE_MAX_LENGTH_BOOSTED, GRIMOIRE_MIN_LENGTH } from '#shared/gamification'
import { hasSkill } from '#shared/skills'
import type { GrimoireSessionDTO } from '#shared/types'

async function getInventoryQty(userId: string, itemId: 'pena_magica' | 'elixir_erudito') {
  const [row] = await db
    .select()
    .from(userInventory)
    .where(and(eq(userInventory.userId, userId), eq(userInventory.itemId, itemId)))
  return row?.quantity ?? 0
}

export default defineEventHandler(async (event): Promise<GrimoireSessionDTO> => {
  const userId = await requireUserId(event)
  const body = await readBody(event)
  const content = typeof body?.content === 'string' ? body.content.trim() : ''
  const useElixir = body?.useElixir === true
  const apostaAlta = body?.apostaAlta === true

  if (content.length < GRIMOIRE_MIN_LENGTH) {
    throw createError({ statusCode: 400, statusMessage: `Cole pelo menos ${GRIMOIRE_MIN_LENGTH} caracteres de conteúdo.` })
  }

  const penaQty = await getInventoryQty(userId, 'pena_magica')
  const usePena = penaQty > 0 && content.length > GRIMOIRE_MAX_LENGTH
  const effectiveMaxLength = usePena ? GRIMOIRE_MAX_LENGTH_BOOSTED : GRIMOIRE_MAX_LENGTH

  if (content.length > effectiveMaxLength) {
    throw createError({ statusCode: 400, statusMessage: `Conteúdo muito longo (máximo ${effectiveMaxLength} caracteres).` })
  }

  const elixirQty = await getInventoryQty(userId, 'elixir_erudito')
  if (useElixir && elixirQty <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Você não tem Elixir do Erudito.' })
  }

  const { summary, quiz } = await generateGrimoireQuiz(content)

  const session = await db.transaction(async (tx) => {
    const skills = await getUnlockedSkillIds(tx, userId)
    if (usePena) await consumeInventoryItem(tx, userId, 'pena_magica', skills)
    if (useElixir) await consumeInventoryItem(tx, userId, 'elixir_erudito', skills)
    const [row] = await tx
      .insert(grimoireSessions)
      .values({
        userId,
        content,
        summary,
        quiz,
        xpBoosted: useElixir,
        apostaAltaUsada: apostaAlta && hasSkill(skills, 'ladino_aposta_alta'),
      })
      .returning()
    return row!
  })

  return toSessionDTO(session)
})
