/**
 * Fixed id for the pre-auth seed user (`db/seed.ts`) — no longer read by any API route now
 * that auth is real (see `server/utils/auth.ts`). Kept only so the first-ever registration
 * (`server/api/auth/register.post.ts`) can find and claim this row instead of starting blank.
 */
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'
