import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { grimoireSessions, userInventory } from '~~/db/schema'
import { DEMO_USER_ID } from '#shared/constants'
import { GRIMOIRE_MAX_LENGTH, GRIMOIRE_MAX_LENGTH_BOOSTED, GRIMOIRE_MIN_LENGTH } from '#shared/gamification'
import type { GrimoireSessionDTO } from '#shared/types'

function getInventoryQty(itemId: 'pena_magica' | 'elixir_erudito') {
  const row = db
    .select()
    .from(userInventory)
    .where(and(eq(userInventory.userId, DEMO_USER_ID), eq(userInventory.itemId, itemId)))
    .get()
  return row?.quantity ?? 0
}

export default defineEventHandler(async (event): Promise<GrimoireSessionDTO> => {
  const body = await readBody(event)
  const content = typeof body?.content === 'string' ? body.content.trim() : ''
  const useElixir = body?.useElixir === true

  if (content.length < GRIMOIRE_MIN_LENGTH) {
    throw createError({ statusCode: 400, statusMessage: `Cole pelo menos ${GRIMOIRE_MIN_LENGTH} caracteres de conteúdo.` })
  }

  const penaQty = getInventoryQty('pena_magica')
  const usePena = penaQty > 0 && content.length > GRIMOIRE_MAX_LENGTH
  const effectiveMaxLength = usePena ? GRIMOIRE_MAX_LENGTH_BOOSTED : GRIMOIRE_MAX_LENGTH

  if (content.length > effectiveMaxLength) {
    throw createError({ statusCode: 400, statusMessage: `Conteúdo muito longo (máximo ${effectiveMaxLength} caracteres).` })
  }

  const elixirQty = getInventoryQty('elixir_erudito')
  if (useElixir && elixirQty <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Você não tem Elixir do Erudito.' })
  }

  const { summary, quiz } = await generateGrimoireQuiz(content)

  const session = db.transaction((tx) => {
    const skills = getUnlockedSkillIds(tx, DEMO_USER_ID)
    if (usePena) consumeInventoryItem(tx, DEMO_USER_ID, 'pena_magica', skills)
    if (useElixir) consumeInventoryItem(tx, DEMO_USER_ID, 'elixir_erudito', skills)
    return tx
      .insert(grimoireSessions)
      .values({ userId: DEMO_USER_ID, content, summary, quiz, xpBoosted: useElixir })
      .returning()
      .get()
  })

  return toSessionDTO(session)
})
