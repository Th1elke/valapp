import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { goldEvents, grimoireSessions, hpEvents, users, xpEvents } from '~~/db/schema'
import { DEMO_USER_ID } from '#shared/constants'
import {
  GRIMOIRE_QUIZ_LENGTH,
  computeRelapseXp,
  getRelapseHpRestore,
  grimoireGoldReward,
  grimoireHpLoss,
  grimoireXpReward,
  levelForXp,
} from '#shared/gamification'
import { hasSkill } from '#shared/skills'
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

    const skills = getUnlockedSkillIds(tx, DEMO_USER_ID)
    const correct = selectedOption === question.correctIndex

    if (!correct) {
      const shield = consumeInventoryItem(tx, DEMO_USER_ID, 'escudo_cristal', skills)
      if (shield.hadItem) {
        return {
          correct: false,
          correctIndex: null,
          explanation: null,
          hp: user.hp,
          relapsed: false,
          battleComplete: false,
          xpAwarded: null,
          correctCount: null,
          level: user.level,
          leveledUp: false,
          shieldUsed: true,
        }
      }
    }

    const newAnswers = [...session.answers, { questionIndex, selectedOption, correct }]

    let hp = user.hp
    let xp = user.xp
    let level = user.level
    let relapsed = false
    let clarividenciaTriggered = false

    if (!correct) {
      if (hasSkill(skills, 'mago_clarividencia') && !session.clarividenciaUsed) {
        clarividenciaTriggered = true
      } else {
        hp = Math.max(0, user.hp - grimoireHpLoss(session.xpBoosted))

        if (hp <= 0) {
          relapsed = true
          const relapseXp = computeRelapseXp(xp)
          const relapseLevel = levelForXp(relapseXp)
          tx.insert(xpEvents)
            .values({ userId: DEMO_USER_ID, type: 'penalidade_recaida', amount: relapseXp - xp, balanceAfter: relapseXp })
            .run()
          xp = relapseXp
          level = relapseLevel
          hp = getRelapseHpRestore(skills)
          tx.insert(hpEvents).values({ userId: DEMO_USER_ID, type: 'reset_recaida', amount: hp - user.hp, hpAfter: hp }).run()
        } else {
          tx.insert(hpEvents)
            .values({ userId: DEMO_USER_ID, habitId: null, type: 'grimorio_erro', amount: hp - user.hp, hpAfter: hp })
            .run()
        }
      }
    }

    const battleComplete = newAnswers.length >= GRIMOIRE_QUIZ_LENGTH
    let xpAwarded: number | null = null
    let correctCount: number | null = null
    let gold = user.gold

    if (battleComplete) {
      correctCount = newAnswers.filter((a) => a.correct).length
      xpAwarded = grimoireXpReward(correctCount) * (session.xpBoosted ? 2 : 1)
      if (xpAwarded > 0) {
        const newXp = xp + xpAwarded
        level = levelForXp(newXp)
        tx.insert(xpEvents).values({ userId: DEMO_USER_ID, type: 'grimorio', amount: xpAwarded, balanceAfter: newXp }).run()
        xp = newXp
      }

      if (hasSkill(skills, 'mago_leitura_dinamica')) {
        const goldAwarded = grimoireGoldReward(correctCount)
        if (goldAwarded > 0) {
          gold = user.gold + goldAwarded
          tx.insert(goldEvents).values({ userId: DEMO_USER_ID, type: 'grimorio', amount: goldAwarded, balanceAfter: gold }).run()
        }
      }
    }

    tx.update(users).set({ hp, xp, level, gold, updatedAt: new Date().toISOString() }).where(eq(users.id, DEMO_USER_ID)).run()

    tx.update(grimoireSessions)
      .set({
        answers: newAnswers,
        status: battleComplete ? 'concluida' : 'gerado',
        correctCount,
        xpAwarded,
        clarividenciaUsed: session.clarividenciaUsed || clarividenciaTriggered,
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
      shieldUsed: false,
    }
  })
})
