import { eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { users } from '~~/db/schema'

let dummyHashPromise: Promise<string> | null = null
/** A real (but unusable) hash to verify against when the e-mail doesn't exist, so login always pays the same hashing cost. */
function getDummyHash() {
  dummyHashPromise ??= hashPassword('dummy-password-used-only-for-timing-safety')
  return dummyHashPromise
}

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  assertRateLimit(`login:${ip}`, { max: 8, windowMs: 10 * 60 * 1000 })

  const body = await readBody(event)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  const invalidCredentials = () => createError({ statusCode: 401, statusMessage: 'E-mail ou senha inválidos.' })
  if (!email || !password) throw invalidCredentials()

  const user = db
    .select({ id: users.id, email: users.email, name: users.name, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .get()

  // Always run verifyPassword, even for an unknown e-mail, so response time can't be used to
  // enumerate which e-mails are registered.
  const valid = await verifyPassword(user?.passwordHash ?? (await getDummyHash()), password)
  if (!user || !valid) throw invalidCredentials()

  await setUserSession(event, { user: { id: user.id, email: user.email, name: user.name } })

  return { ok: true }
})
