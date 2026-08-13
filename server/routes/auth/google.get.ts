import { eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { users } from '~~/db/schema'

/**
 * Vincula a conta Google do usuário já logado (não é um fluxo de login) — precisa de sessão
 * existente antes de iniciar o consentimento do Google. `access_type: 'offline' + prompt: 'consent'`
 * força o Google a devolver um refresh_token (que só vem no primeiro consentimento por padrão).
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) return sendRedirect(event, '/login')

  return defineOAuthGoogleEventHandler({
    config: {
      scope: [
        'openid',
        'email',
        'https://www.googleapis.com/auth/classroom.courses.readonly',
        'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
      ],
      authorizationParams: { access_type: 'offline', prompt: 'consent' },
    },
    async onSuccess(event, { user, tokens }) {
      const { user: appUser } = await requireUserSession(event)

      const update: Record<string, string | null> = {
        googleAccessToken: tokens.access_token,
        googleTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        googleEmail: user.email ?? null,
        updatedAt: new Date().toISOString(),
      }
      if (tokens.refresh_token) update.googleRefreshToken = tokens.refresh_token

      await db.update(users).set(update).where(eq(users.id, appUser.id))

      return sendRedirect(event, '/perfil?google=linked')
    },
    async onError(event) {
      return sendRedirect(event, '/perfil?google=error')
    },
  })(event)
})
