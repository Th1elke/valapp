import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { grimoireSessions, hpEvents, users, xpEvents } from '~~/db/schema'
import { DEMO_USER_ID } from '#shared/constants'
import {
  GRIMOIRE_HP_LOSS_PER_WRONG,
  GRIMOIRE_QUIZ_LENGTH,
  RELAPSE_HP_RESTORE,
  grimoireXpReward,
  levelForXp,
  xpForLevel,
} from '#shared/gamification'
import type { GrimoireAnswerResultDTO } from '#shared/types'

export default defineEventHandler(async (event): Promise<GrimoireAnswerResultDTO> => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id é obrigatório.' })

  const body = await readBody(event)
  const questionIndex = body?.questionIndex
  const selectedOption = body?.selectedOption
  if (typeof questionIndex !== 'number' || typeof selectedOption !== 'number') {
    throw createError({ statusCode: 400, statusMessage: 'questionIndex e selectedOption são obrigatórios.' })
  }

  return db.transaction((tx): GrimoireAnswerResultDTO => {
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

    const user = tx.select().from(users).where(eq(users.id, DEMO_USER_ID)).get()
    if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário demo não encontrado.' })

    const correct = selectedOption === question.correctIndex
    const newAnswers = [...session.answers, { questionIndex, selectedOption, correct }]

    let hp = user.hp
    let xp = user.xp
    let level = user.level
    let relapsed = false

    if (!correct) {
      hp = Math.max(0, user.hp - GRIMOIRE_HP_LOSS_PER_WRONG)

      if (hp <= 0) {
        relapsed = true
        const relapseLevel = Math.max(1, user.level - 1)
        const relapseXp = xpForLevel(relapseLevel)
        tx.insert(xpEvents)
          .values({ userId: DEMO_USER_ID, type: 'penalidade_recaida', amount: relapseXp - xp, balanceAfter: relapseXp })
          .run()
        xp = relapseXp
        level = relapseLevel
        hp = RELAPSE_HP_RESTORE
        tx.insert(hpEvents).values({ userId: DEMO_USER_ID, type: 'reset_recaida', amount: hp - user.hp, hpAfter: hp }).run()
      } else {
        tx.insert(hpEvents)
          .values({ userId: DEMO_USER_ID, habitId: null, type: 'grimorio_erro', amount: hp - user.hp, hpAfter: hp })
          .run()
      }
    }

    const battleComplete = newAnswers.length >= GRIMOIRE_QUIZ_LENGTH
    let xpAwarded: number | null = null
    let correctCount: number | null = null

    if (battleComplete) {
      correctCount = newAnswers.filter((a) => a.correct).length
      xpAwarded = grimoireXpReward(correctCount)
      if (xpAwarded > 0) {
        const newXp = xp + xpAwarded
        level = levelForXp(newXp)
        tx.insert(xpEvents).values({ userId: DEMO_USER_ID, type: 'grimorio', amount: xpAwarded, balanceAfter: newXp }).run()
        xp = newXp
      }
    }

    tx.update(users).set({ hp, xp, level, updatedAt: new Date().toISOString() }).where(eq(users.id, DEMO_USER_ID)).run()

    tx.update(grimoireSessions)
      .set({
        answers: newAnswers,
        status: battleComplete ? 'concluida' : 'gerado',
        correctCount,
        xpAwarded,
        completedAt: battleComplete ? new Date().toISOString() : null,
      })
      .where(eq(grimoireSessions.id, session.id))
      .run()

    return {
      correct,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      hp,
      relapsed,
      battleComplete,
      xpAwarded,
      correctCount,
      level,
      leveledUp: level > user.level,
    }
  })
})
