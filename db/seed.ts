import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { db } from './client'
import { users } from './schema'
import { DEMO_USER_ID } from '../shared/constants'
import { HP_INITIAL } from '../shared/gamification'

const existing = db.select().from(users).where(eq(users.id, DEMO_USER_ID)).get()

if (existing) {
  console.log('Demo user already exists, skipping seed.')
} else {
  db.insert(users)
    .values({
      id: DEMO_USER_ID,
      email: 'demo@valapp.local',
      passwordHash: 'no-auth-yet',
      name: 'Gustavo',
      level: 1,
      xp: 0,
      hp: HP_INITIAL,
      shieldsRemaining: 1,
    })
    .run()
  console.log('Demo user seeded.')
}
