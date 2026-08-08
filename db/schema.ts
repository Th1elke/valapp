import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core'

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID())

const createdAt = () =>
  text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())

/**
 * Nullable on purpose: rows written before this column existed have no real "last updated"
 * value, so backfilling one would be a lie. Every write going forward sets it explicitly
 * (`.set({ updatedAt: new Date().toISOString() })`), same as the rest of the codebase already does.
 */
const updatedAt = () => text('updated_at').$defaultFn(() => new Date().toISOString())

export const playerClasses = ['guerreiro', 'mago', 'paladino', 'arqueiro', 'ladino', 'bardo'] as const
export const habitCategories = ['fisico', 'mente', 'disciplina', 'social', 'criatividade'] as const
export const habitDifficulties = ['facil', 'medio', 'dificil'] as const
export const habitFrequencies = ['diaria', 'semanal', 'dias_customizados'] as const
export const habitStatuses = ['ativo', 'pausado', 'arquivado'] as const
export const xpEventTypes = [
  'checkin',
  'dia_perfeito',
  'penalidade_recaida',
  'custo_troca_classe',
  'ajuste_manual',
  'missao',
  'grimorio',
  'tiro_certeiro',
  'golpe_duplo',
] as const
export const hpEventTypes = [
  'habito_nao_cumprido',
  'regen_dia_perfeito',
  'reset_recaida',
  'escudo_usado',
  'pocao_cura',
  'grimorio_erro',
  'penitencia',
] as const
export const goldEventTypes = ['checkin', 'dia_perfeito', 'missao', 'compra', 'ajuste_manual', 'grimorio'] as const
export const shieldTargetTypes = ['protecao_dia', 'protecao_streak'] as const
export const missionStatuses = ['ativa', 'concluida', 'cancelada'] as const
export const grimoireStatuses = ['gerado', 'concluida'] as const
export const inventoryItemIds = [
  'potion_small',
  'potion_medium',
  'potion_large',
  'olho_visao',
  'escudo_cristal',
  'elixir_erudito',
  'pena_magica',
] as const

export const users = sqliteTable('users', {
  id: id(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  timezone: text('timezone').notNull().default('America/Sao_Paulo'),

  playerClass: text('player_class', { enum: playerClasses }),
  level: integer('level').notNull().default(1),
  xp: integer('xp').notNull().default(0),
  hp: integer('hp').notNull().default(100),
  gold: integer('gold').notNull().default(0),

  classChosenAt: text('class_chosen_at'),
  lastClassChangeAt: text('last_class_change_at'),

  shieldsRemaining: integer('shields_remaining').notNull().default(1),
  shieldWeekStart: text('shield_week_start'),

  restDayDate: text('rest_day_date'),
  lastShowMustGoOnDate: text('last_show_must_go_on_date'),

  equippedTitle: text('equipped_title'),
  equippedAvatarBorder: text('equipped_avatar_border'),
  equippedTheme: text('equipped_theme'),
  avatarUrl: text('avatar_url'),
  coverUrl: text('cover_url'),

  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const habits = sqliteTable('habits', {
  id: id(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  category: text('category', { enum: habitCategories }).notNull(),
  difficulty: text('difficulty', { enum: habitDifficulties }).notNull(),
  frequency: text('frequency', { enum: habitFrequencies }).notNull().default('diaria'),
  customDays: text('custom_days', { mode: 'json' }).$type<number[]>(),

  status: text('status', { enum: habitStatuses }).notNull().default('ativo'),
  pausedFrom: text('paused_from'),
  pausedUntil: text('paused_until'),

  streakCount: integer('streak_count').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  lastBrokenStreak: integer('last_broken_streak'),
  lastBrokenStreakDate: text('last_broken_streak_date'),
  dominatedAt: text('dominated_at'),

  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const checkIns = sqliteTable(
  'check_ins',
  {
    id: id(),
    habitId: text('habit_id')
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    checkinDate: text('checkin_date').notNull(),
    completedAt: createdAt(),
    xpAwarded: integer('xp_awarded').notNull(),
    goldAwarded: integer('gold_awarded').notNull().default(0),
    streakAtCheckin: integer('streak_at_checkin').notNull(),
  },
  (table) => [uniqueIndex('check_ins_habit_date_unique').on(table.habitId, table.checkinDate)],
)

export const xpEvents = sqliteTable('xp_events', {
  id: id(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  habitId: text('habit_id').references(() => habits.id, { onDelete: 'set null' }),
  type: text('type', { enum: xpEventTypes }).notNull(),
  amount: integer('amount').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  createdAt: createdAt(),
})

export const hpEvents = sqliteTable('hp_events', {
  id: id(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  habitId: text('habit_id').references(() => habits.id, { onDelete: 'set null' }),
  type: text('type', { enum: hpEventTypes }).notNull(),
  amount: integer('amount').notNull(),
  hpAfter: integer('hp_after').notNull(),
  createdAt: createdAt(),
})

export const goldEvents = sqliteTable('gold_events', {
  id: id(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  habitId: text('habit_id').references(() => habits.id, { onDelete: 'set null' }),
  missionId: text('mission_id').references(() => missions.id, { onDelete: 'set null' }),
  type: text('type', { enum: goldEventTypes }).notNull(),
  amount: integer('amount').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  createdAt: createdAt(),
})

export const missions = sqliteTable('missions', {
  id: id(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category', { enum: habitCategories }),
  difficulty: text('difficulty', { enum: habitDifficulties }).notNull(),
  xpReward: integer('xp_reward').notNull(),
  goldReward: integer('gold_reward').notNull(),
  status: text('status', { enum: missionStatuses }).notNull().default('ativa'),
  deadline: text('deadline'),
  createdAt: createdAt(),
  completedAt: text('completed_at'),
})

export interface GrimoireQuizQuestion {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface GrimoireAnswer {
  questionIndex: number
  selectedOption: number
  correct: boolean
}

export const grimoireSessions = sqliteTable('grimoire_sessions', {
  id: id(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  summary: text('summary').notNull(),
  quiz: text('quiz', { mode: 'json' }).$type<GrimoireQuizQuestion[]>().notNull(),
  answers: text('answers', { mode: 'json' }).$type<GrimoireAnswer[]>().notNull().$defaultFn(() => []),
  status: text('status', { enum: grimoireStatuses }).notNull().default('gerado'),
  correctCount: integer('correct_count'),
  xpAwarded: integer('xp_awarded'),
  xpBoosted: integer('xp_boosted', { mode: 'boolean' }).notNull().default(false),
  clarividenciaUsed: integer('clarividencia_used', { mode: 'boolean' }).notNull().default(false),
  manipulacaoUsada: integer('manipulacao_usada', { mode: 'boolean' }).notNull().default(false),
  apostaAltaUsada: integer('aposta_alta_usada', { mode: 'boolean' }).notNull().default(false),
  createdAt: createdAt(),
  completedAt: text('completed_at'),
})

export const userSkills = sqliteTable(
  'user_skills',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    skillId: text('skill_id').notNull(),
    unlockedAt: createdAt(),
  },
  (table) => [uniqueIndex('user_skills_user_skill_unique').on(table.userId, table.skillId)],
)

export const userInventory = sqliteTable(
  'user_inventory',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    itemId: text('item_id', { enum: inventoryItemIds }).notNull(),
    quantity: integer('quantity').notNull().default(0),
    updatedAt: createdAt(),
  },
  (table) => [uniqueIndex('user_inventory_user_item_unique').on(table.userId, table.itemId)],
)

export const userCosmetics = sqliteTable(
  'user_cosmetics',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    cosmeticId: text('cosmetic_id').notNull(),
    unlockedAt: createdAt(),
  },
  (table) => [uniqueIndex('user_cosmetics_user_cosmetic_unique').on(table.userId, table.cosmeticId)],
)

export const shieldUses = sqliteTable(
  'shield_uses',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    habitId: text('habit_id').references(() => habits.id, { onDelete: 'set null' }),
    weekStart: text('week_start').notNull(),
    targetType: text('target_type', { enum: shieldTargetTypes }).notNull(),
    protectedDate: text('protected_date').notNull(),
    usedAt: createdAt(),
  },
  (table) => [uniqueIndex('shield_uses_user_week_unique').on(table.userId, table.weekStart)],
)

export const classChanges = sqliteTable('class_changes', {
  id: id(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  oldClass: text('old_class', { enum: playerClasses }),
  newClass: text('new_class', { enum: playerClasses }).notNull(),
  xpCost: integer('xp_cost').notNull(),
  changedAt: createdAt(),
})

export const dailyClosures = sqliteTable(
  'daily_closures',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    closureDate: text('closure_date').notNull(),
    perfectDay: integer('perfect_day', { mode: 'boolean' }).notNull().default(false),
    relapsed: integer('relapsed', { mode: 'boolean' }).notNull().default(false),
    xpChange: integer('xp_change').notNull().default(0),
    hpChange: integer('hp_change').notNull().default(0),
    goldChange: integer('gold_change').notNull().default(0),
    processedAt: createdAt(),
  },
  (table) => [uniqueIndex('daily_closures_user_date_unique').on(table.userId, table.closureDate)],
)
