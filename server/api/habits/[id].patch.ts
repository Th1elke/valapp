import { and, eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { habitFrequencies, habits, habitStatuses } from '~~/db/schema'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id é obrigatório.' })

  const body = await readBody(event)
  if (body?.status !== undefined && !habitStatuses.includes(body.status)) {
    throw createError({ statusCode: 400, statusMessage: 'Status inválido.' })
  }

  const updates: Partial<typeof habits.$inferInsert> = { updatedAt: new Date().toISOString() }

  if (body?.status) {
    updates.status = body.status
    if (body.status === 'pausado') {
      // "Férias com data" (docs seção 6): pausedUntil é opcional — sem ele, o hábito fica pausado
      // indefinidamente até o usuário retomar na mão. Com ele, resumeExpiredPauses
      // (server/utils/habits.ts) retoma sozinho assim que a data passa.
      if (body.pausedUntil !== undefined && body.pausedUntil !== null) {
        if (typeof body.pausedUntil !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.pausedUntil)) {
          throw createError({ statusCode: 400, statusMessage: 'Data de retorno inválida.' })
        }
        if (body.pausedUntil < todayStr()) {
          throw createError({ statusCode: 400, statusMessage: 'A data de retorno precisa ser hoje ou no futuro.' })
        }
        updates.pausedUntil = body.pausedUntil
      } else {
        updates.pausedUntil = null
      }
      updates.pausedFrom = todayStr()
    } else {
      // Retomando manualmente (ou arquivando) — limpa qualquer janela de pausa agendada.
      updates.pausedFrom = null
      updates.pausedUntil = null
    }
  }

  if (body?.frequency !== undefined) {
    if (!habitFrequencies.includes(body.frequency)) {
      throw createError({ statusCode: 400, statusMessage: 'Frequência inválida.' })
    }
    updates.frequency = body.frequency

    if (body.frequency === 'dias_customizados') {
      if (!Array.isArray(body.customDays) || body.customDays.length === 0) {
        throw createError({ statusCode: 400, statusMessage: 'Escolha pelo menos um dia da semana.' })
      }
      if (!body.customDays.every((d: unknown) => typeof d === 'number' && Number.isInteger(d) && d >= 0 && d <= 6)) {
        throw createError({ statusCode: 400, statusMessage: 'Dias da semana inválidos.' })
      }
      updates.customDays = [...new Set(body.customDays)].sort((a, b) => a - b)
    } else {
      updates.customDays = null
    }

    if (body.frequency === 'semanal') {
      const weeklyTarget = typeof body.weeklyTarget === 'number' ? body.weeklyTarget : Number(body.weeklyTarget)
      if (!Number.isInteger(weeklyTarget) || weeklyTarget < 1 || weeklyTarget > 7) {
        throw createError({ statusCode: 400, statusMessage: 'Meta semanal precisa ser um número entre 1 e 7.' })
      }
      updates.weeklyTarget = weeklyTarget
    } else {
      updates.weeklyTarget = null
    }
  }

  const [updated] = await db
    .update(habits)
    .set(updates)
    .where(and(eq(habits.id, id), eq(habits.userId, userId)))
    .returning()

  if (!updated) throw createError({ statusCode: 404, statusMessage: 'Hábito não encontrado.' })
  return updated
})
