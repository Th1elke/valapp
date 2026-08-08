import type { H3Event } from 'h3'

declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    name: string
  }
}

/** Resolves the logged-in user's id from the session cookie — throws 401 if not logged in. */
export async function requireUserId(event: H3Event): Promise<string> {
  const { user } = await requireUserSession(event)
  return user.id
}
