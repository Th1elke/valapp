import { eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { users } from '~~/db/schema'

/** Sentinel written by `db/seed.ts` for the pre-auth demo account — see claim logic below. */
const UNCLAIMED_PASSWORD_HASH = 'no-auth-yet'
const RETURNING_COLUMNS = { id: users.id, email: users.email, name: users.name }

function emailTaken() {
  return createError({ statusCode: 409, statusMessage: 'Já existe uma conta com esse e-mail.' })
}

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  assertRateLimit(`register:${ip}`, { max: 5, windowMs: 60 * 60 * 1000 })

  const body = await readBody(event)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const name = typeof body?.name === 'string' ? body.name.trim() : ''

  if (!email || !email.includes('@')) throw createError({ statusCode: 400, statusMessage: 'E-mail inválido.' })
  if (password.length < 8) throw createError({ statusCode: 400, statusMessage: 'A senha precisa ter pelo menos 8 caracteres.' })
  if (!name) throw createError({ statusCode: 400, statusMessage: 'Nome é obrigatório.' })

  const existing = db.select({ id: users.id }).from(users).where(eq(users.email, email)).get()
  if (existing) throw emailTaken()

  const passwordHash = await hashPassword(password)

  let user: { id: string; email: string; name: string }
  try {
    // Atomic claim: the WHERE clause itself is the concurrency guard (SQLite resolves it as a
    // single UPDATE), so two simultaneous registrations can't both "win" the seed account — the
    // loser just finds 0 rows matched and falls through to a normal insert below.
    const claimed = db
      .update(users)
      .set({ email, passwordHash, name, updatedAt: new Date().toISOString() })
      .where(eq(users.passwordHash, UNCLAIMED_PASSWORD_HASH))
      .returning(RETURNING_COLUMNS)
      .get()

    user = claimed ?? db.insert(users).values({ email, passwordHash, name }).returning(RETURNING_COLUMNS).get()
  } catch (err) {
    // Two concurrent requests can both pass the `existing` check above for the same e-mail;
    // the unique index is the real guard, this just turns that into a friendly error.
    if (err instanceof Error && err.message.includes('UNIQUE')) throw emailTaken()
    throw err
  }

  await setUserSession(event, { user })

  return { ok: true }
})
