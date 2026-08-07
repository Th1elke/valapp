import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.')
}

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL.replace(/^file:/, ''),
  },
  strict: true,
  verbose: true,
})
