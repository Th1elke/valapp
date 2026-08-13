import { eq } from 'drizzle-orm'
import { db } from '~~/db/client'
import { users } from '~~/db/schema'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const CLASSROOM_BASE = 'https://classroom.googleapis.com/v1'

interface GoogleTokenResponse {
  access_token: string
  expires_in: number
  error?: string
}

interface ClassroomDueDate {
  year: number
  month: number
  day: number
}

interface ClassroomCourseWork {
  id: string
  title: string
  description?: string
  state: string
  dueDate?: ClassroomDueDate
}

export interface ClassroomCourseWorkItem {
  externalId: string
  title: string
  description: string | null
  deadline: string | null
}

async function refreshGoogleAccessToken(userId: string, refreshToken: string): Promise<string> {
  const clientId = process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID
  const clientSecret = process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw createError({ statusCode: 500, statusMessage: 'NUXT_OAUTH_GOOGLE_CLIENT_ID/SECRET não configurados.' })
  }

  let response: GoogleTokenResponse
  try {
    response = await $fetch<GoogleTokenResponse>(TOKEN_URL, {
      method: 'POST',
      body: { grant_type: 'refresh_token', refresh_token: refreshToken, client_id: clientId, client_secret: clientSecret },
    })
  } catch (err) {
    const errorCode = (err as { data?: { error?: string } })?.data?.error
    if (errorCode === 'invalid_grant') {
      await db
        .update(users)
        .set({
          googleAccessToken: null,
          googleRefreshToken: null,
          googleTokenExpiresAt: null,
          googleEmail: null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, userId))
      throw createError({ statusCode: 401, statusMessage: 'A conexão com o Google expirou. Vincule sua conta novamente.' })
    }
    throw createError({ statusCode: 502, statusMessage: 'Falha ao renovar o acesso ao Google.' })
  }

  await db
    .update(users)
    .set({
      googleAccessToken: response.access_token,
      googleTokenExpiresAt: new Date(Date.now() + response.expires_in * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userId))

  return response.access_token
}

async function getValidGoogleAccessToken(userId: string): Promise<string> {
  const [user] = await db
    .select({
      googleAccessToken: users.googleAccessToken,
      googleRefreshToken: users.googleRefreshToken,
      googleTokenExpiresAt: users.googleTokenExpiresAt,
    })
    .from(users)
    .where(eq(users.id, userId))

  if (!user?.googleRefreshToken) {
    throw createError({ statusCode: 400, statusMessage: 'Conta Google não vinculada.' })
  }

  const expiresAt = user.googleTokenExpiresAt ? Date.parse(user.googleTokenExpiresAt) : 0
  if (user.googleAccessToken && expiresAt - Date.now() > 60_000) {
    return user.googleAccessToken
  }

  return refreshGoogleAccessToken(userId, user.googleRefreshToken)
}

function classroomDueDateToDeadline(dueDate?: ClassroomDueDate): string | null {
  if (!dueDate) return null
  return `${dueDate.year}-${String(dueDate.month).padStart(2, '0')}-${String(dueDate.day).padStart(2, '0')}`
}

async function fetchAllPages<T>(
  url: string,
  accessToken: string,
  itemsKey: string,
  extraQuery: Record<string, string> = {},
): Promise<T[]> {
  const items: T[] = []
  let pageToken: string | undefined

  do {
    const response = await $fetch<Record<string, unknown>>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      query: { pageSize: 100, pageToken, ...extraQuery },
    })
    items.push(...((response[itemsKey] as T[] | undefined) ?? []))
    pageToken = response.nextPageToken as string | undefined
  } while (pageToken)

  return items
}

/** Busca todas as atividades publicadas nas turmas ativas do Classroom do usuário. */
export async function syncClassroomCourseWork(userId: string): Promise<ClassroomCourseWorkItem[]> {
  const accessToken = await getValidGoogleAccessToken(userId)

  try {
    const courses = await fetchAllPages<{ id: string }>(`${CLASSROOM_BASE}/courses`, accessToken, 'courses', {
      courseStates: 'ACTIVE',
    })

    const items: ClassroomCourseWorkItem[] = []
    for (const course of courses) {
      const courseWork = await fetchAllPages<ClassroomCourseWork>(
        `${CLASSROOM_BASE}/courses/${course.id}/courseWork`,
        accessToken,
        'courseWork',
      )
      for (const cw of courseWork) {
        if (cw.state !== 'PUBLISHED') continue
        items.push({
          externalId: cw.id,
          title: cw.title,
          description: cw.description ?? null,
          deadline: classroomDueDateToDeadline(cw.dueDate),
        })
      }
    }

    return items
  } catch (err) {
    throw createError({ statusCode: 502, statusMessage: `Falha ao consultar o Google Classroom: ${(err as Error).message}` })
  }
}
