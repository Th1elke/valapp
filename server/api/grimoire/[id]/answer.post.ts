import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { goldEvents, grimoireSessions, hpEvents, users, xpEvents } from '~~/db/schema'
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
  const userId = await requireUserId(event)
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
      .where(and(eq(grimoireSessions.id, id), eq(grimoireSessions.userId, userId)))
      .get()
    if (!session) throw createError({ statusCode: 404, statusMessage: 'Sessão não encontrada.' })
    if (session.status === 'concluida') throw createError({ statusCode: 400, statusMessage: 'Batalha já concluída.' })

    const question = session.quiz[questionIndex]
    if (!question) throw createError({ statusCode: 400, statusMessage: 'Pergunta inválida.' })
    if (session.answers.some((a) => a.questionIndex === questionIndex)) {
      throw createError({ statusCode: 409, statusMessage: 'Essa pergunta já foi respondida.' })
    }

    const user = tx.select().from(users).where(eq(users.id, userId)).get()
    if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })

    const skills = getUnlockedSkillIds(tx, userId)
    const correct = selectedOption === question.correctIndex

    if (!correct) {
      const shield = consumeInventoryItem(tx, userId, 'escudo_cristal', skills)
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
          dodged: false,
        }
      }

      // Fintar o Destino (Ladino): 25% de chance de o erro simplesmente não contar, sem limite por batalha.
      if (hasSkill(skills, 'ladino_fintar_destino') && Math.random() < 0.25) {
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
          shieldUsed: false,
          dodged: true,
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
        const hpLoss = grimoireHpLoss(session.xpBoosted) * (session.apostaAltaUsada ? 2 : 1)
        hp = Math.max(0, user.hp - hpLoss)

        if (hp <= 0) {
          relapsed = true
          const relapseXp = computeRelapseXp(xp)
          const relapseLevel = levelForXp(relapseXp)
          tx.insert(xpEvents)
            .values({ userId, type: 'penalidade_recaida', amount: relapseXp - xp, balanceAfter: relapseXp })
            .run()
          xp = relapseXp
          level = relapseLevel
          hp = getRelapseHpRestore(skills)
          tx.insert(hpEvents).values({ userId, type: 'reset_recaida', amount: hp - user.hp, hpAfter: hp }).run()
        } else {
          tx.insert(hpEvents)
            .values({ userId, habitId: null, type: 'grimorio_erro', amount: hp - user.hp, hpAfter: hp })
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
      xpAwarded = grimoireXpReward(correctCount) * (session.xpBoosted ? 2 : 1) * (session.apostaAltaUsada ? 2 : 1)
      if (xpAwarded > 0) {
        const newXp = xp + xpAwarded
        level = levelForXp(newXp)
        tx.insert(xpEvents).values({ userId, type: 'grimorio', amount: xpAwarded, balanceAfter: newXp }).run()
        xp = newXp
      }

      if (hasSkill(skills, 'mago_leitura_dinamica') || session.apostaAltaUsada) {
        const goldAwarded = grimoireGoldReward(correctCount) * (session.apostaAltaUsada ? 2 : 1)
        if (goldAwarded > 0) {
          gold = user.gold + goldAwarded
          tx.insert(goldEvents).values({ userId, type: 'grimorio', amount: goldAwarded, balanceAfter: gold }).run()
        }
      }
    }

    tx.update(users).set({ hp, xp, level, gold, updatedAt: new Date().toISOString() }).where(eq(users.id, userId)).run()

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
      dodged: false,
    }
  })
})
