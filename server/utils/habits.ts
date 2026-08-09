import { and, eq, lt } from 'drizzle-orm'
import { db } from '~~/db/client'
import { habits } from '~~/db/schema'
import { todayStr } from '#shared/date'

type Writable = Pick<typeof db, 'update'>

/**
 * "Férias com data" (docs seção 6): auto-resume qualquer hábito cujo `pausedUntil` já passou. Sem
 * cron pra isso — roda de forma preguiçosa sempre que os hábitos do usuário são tocados, mesmo
 * padrão de `ensureWeeklyShield` (server/utils/shield.ts). `pausedUntil` é inclusivo (pausado até
 * e incluindo aquele dia, resume no dia seguinte), então a comparação usa "<" contra hoje.
 */
export async function resumeExpiredPauses(tx: Writable, userId: string): Promise<void> {
  const today = todayStr()
  await tx
    .update(habits)
    .set({ status: 'ativo', pausedFrom: null, pausedUntil: null, updatedAt: new Date().toISOString() })
    .where(and(eq(habits.userId, userId), eq(habits.status, 'pausado'), lt(habits.pausedUntil, today)))
}
