import type { grimoireSessions } from '~~/db/schema'
import type { GrimoireSessionDTO } from '#shared/types'

type SessionRow = typeof grimoireSessions.$inferSelect

export function toSessionDTO(session: SessionRow): GrimoireSessionDTO {
  return {
    id: session.id,
    summary: session.summary,
    quiz: session.quiz.map((q) => ({ question: q.question, options: q.options })),
    answers: session.answers,
    status: session.status,
    correctCount: session.correctCount,
    xpAwarded: session.xpAwarded,
    createdAt: session.createdAt,
  }
}
