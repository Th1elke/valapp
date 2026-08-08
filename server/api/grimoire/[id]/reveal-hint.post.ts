import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { grimoireSessions } from '~~/db/schema'
import { DEMO_USER_ID } from '#shared/constants'
import { hasSkill } from '#shared/skills'

interface RevealHintResultDTO {
  eliminatedIndices: number[]
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default defineEventHandler(async (event): Promise<RevealHintResultDTO> => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id é obrigatório.' })

  const body = await readBody(event)
  const questionIndex = body?.questionIndex
  if (typeof questionIndex !== 'number') {
    throw createError({ statusCode: 400, statusMessage: 'questionIndex é obrigatório.' })
  }

  return db.transaction((tx): RevealHintResultDTO => {
    const session = tx
      .select()
      .from(grimoireSessions)
      .where(and(eq(grimoireSessions.id, id), eq(grimoireSessions.userId, DEMO_USER_ID)))
      .get()
    if (!session) throw createError({ statusCode: 404, statusMessage: 'Sessão não encontrada.' })
    if (session.status === 'concluida') throw createError({ statusCode: 400, statusMessage: 'Batalha já concluída.' })

    const question = session.quiz[questionIndex]
    if (!question) throw createError({ statusCode: 400, statusMessage: 'Pergunta inválida.' })
    if (session.answers.some((a) => a.questionIndex === questionIndex)) {
      throw createError({ statusCode: 409, statusMessage: 'Essa pergunta já foi respondida.' })
    }

    const skills = getUnlockedSkillIds(tx, DEMO_USER_ID)
    const manipulacaoFree = hasSkill(skills, 'mago_manipulacao_destino') && !session.manipulacaoUsada

    if (!manipulacaoFree) {
      const { hadItem } = consumeInventoryItem(tx, DEMO_USER_ID, 'olho_visao', skills)
      if (!hadItem) throw createError({ statusCode: 400, statusMessage: 'Você não tem o Olho da Visão Verdadeira.' })
    }

    const wrongIndices = question.options.map((_, i) => i).filter((i) => i !== question.correctIndex)
    if (wrongIndices.length < 2) {
      throw createError({ statusCode: 400, statusMessage: 'Essa pergunta não tem alternativas suficientes para o 50/50.' })
    }
    const eliminatedIndices = shuffle(wrongIndices).slice(0, 2)

    if (manipulacaoFree) {
      tx.update(grimoireSessions).set({ manipulacaoUsada: true }).where(eq(grimoireSessions.id, session.id)).run()
    }

    return { eliminatedIndices }
  })
})
