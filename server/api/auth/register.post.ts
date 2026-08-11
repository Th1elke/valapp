import { eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { users } from '~~/db/schema'
import { weekStartStr } from '#shared/date'
import { containsEmoji, MAX_NAME_LENGTH, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '#shared/validation'

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
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw createError({ statusCode: 400, statusMessage: `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` })
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw createError({ statusCode: 400, statusMessage: `A senha pode ter no máximo ${MAX_PASSWORD_LENGTH} caracteres.` })
  }
  if (containsEmoji(password)) throw createError({ statusCode: 400, statusMessage: 'A senha não pode conter emojis.' })
  if (!name) throw createError({ statusCode: 400, statusMessage: 'Nome é obrigatório.' })
  if (name.length > MAX_NAME_LENGTH) {
    throw createError({ statusCode: 400, statusMessage: `Nome muito longo (máximo ${MAX_NAME_LENGTH} caracteres).` })
  }
  if (containsEmoji(name)) throw createError({ statusCode: 400, statusMessage: 'O nome não pode conter emojis.' })

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
  if (existing) throw emailTaken()

  const passwordHash = await hashPassword(password)

  let user: { id: string; email: string; name: string }
  try {
    // Atomic claim: the WHERE clause itself is the concurrency guard (SQLite resolves it as a
    // single UPDATE), so two simultaneous registrations can't both "win" the seed account — the
    // loser just finds 0 rows matched and falls through to a normal insert below.
    const [claimed] = await db
      .update(users)
      .set({ email, passwordHash, name, shieldWeekStart: weekStartStr(), updatedAt: new Date().toISOString() })
      .where(eq(users.passwordHash, UNCLAIMED_PASSWORD_HASH))
      .returning(RETURNING_COLUMNS)

    user =
      claimed ??
      (await db.insert(users).values({ email, passwordHash, name, shieldWeekStart: weekStartStr() }).returning(RETURNING_COLUMNS))[0]!
  } catch (err) {
    // Two concurrent requests can both pass the `existing` check above for the same e-mail;
    // the unique index is the real guard, this just turns that into a friendly error.
    // Postgres reports a unique-violation as SQLSTATE 23505 (error message text isn't stable
    // across drivers/dialects, unlike SQLite's old "UNIQUE constraint failed" string).
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === '23505') throw emailTaken()
    throw err
  }

  await setUserSession(event, { user })

  return { ok: true }
})
