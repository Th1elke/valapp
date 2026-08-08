import { eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { playerClasses, users } from '~~/db/schema'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const body = await readBody(event)
  if (!playerClasses.includes(body?.playerClass)) {
    throw createError({ statusCode: 400, statusMessage: 'Classe inválida.' })
  }

  const user = db.select().from(users).where(eq(users.id, userId)).get()
  if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })
  if (user.level < 5) {
    throw createError({ statusCode: 400, statusMessage: 'Só é possível escolher uma classe a partir do nível 5.' })
  }
  if (user.playerClass) {
    throw createError({ statusCode: 400, statusMessage: 'Classe já escolhida. Troca de classe ainda não implementada.' })
  }

  const updated = db
    .update(users)
    .set({ playerClass: body.playerClass, classChosenAt: new Date().toISOString() })
    .where(eq(users.id, userId))
    .returning()
    .get()

  return updated
})
