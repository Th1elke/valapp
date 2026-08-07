import { db } from '~~/db/client'
import { grimoireSessions } from '~~/db/schema'
import { DEMO_USER_ID } from '#shared/constants'
import type { GrimoireSessionDTO } from '#shared/types'

const MIN_LENGTH = 100
const MAX_LENGTH = 12000

export default defineEventHandler(async (event): Promise<GrimoireSessionDTO> => {
  const body = await readBody(event)
  const content = typeof body?.content === 'string' ? body.content.trim() : ''

  if (content.length < MIN_LENGTH) {
    throw createError({ statusCode: 400, statusMessage: `Cole pelo menos ${MIN_LENGTH} caracteres de conteúdo.` })
  }
  if (content.length > MAX_LENGTH) {
    throw createError({ statusCode: 400, statusMessage: `Conteúdo muito longo (máximo ${MAX_LENGTH} caracteres).` })
  }

  const { summary, quiz } = await generateGrimoireQuiz(content)

  const session = db.insert(grimoireSessions).values({ userId: DEMO_USER_ID, content, summary, quiz }).returning().get()

  return toSessionDTO(session)
})
