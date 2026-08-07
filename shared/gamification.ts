import type { HabitCategory, HabitDifficulty, PlayerClass } from './types'

export const DIFFICULTY_XP: Record<HabitDifficulty, number> = {
  facil: 10,
  medio: 20,
  dificil: 35,
}

export const DIFFICULTY_HP_LOSS: Record<HabitDifficulty, number> = {
  facil: 2,
  medio: 5,
  dificil: 10,
}

export const DIFFICULTY_GOLD: Record<HabitDifficulty, number> = {
  facil: 5,
  medio: 10,
  dificil: 20,
}

export const MISSION_REWARD_MULTIPLIER = 3

export const GRIMOIRE_QUIZ_LENGTH = 3
export const GRIMOIRE_BOSS_XP = 150
export const GRIMOIRE_HP_LOSS_PER_WRONG = 3

/** XP for a finished Grimório battle, proportional to accuracy (docs section 12.2). */
export function grimoireXpReward(correctCount: number): number {
  return Math.round((GRIMOIRE_BOSS_XP * correctCount) / GRIMOIRE_QUIZ_LENGTH)
}

export const PERFECT_DAY_XP_BONUS = 15
export const PERFECT_DAY_GOLD_BONUS = 10
export const HP_REGEN_PERFECT_DAY = 5
export const HP_MAX = 100
export const HP_INITIAL = 100
export const RELAPSE_HP_RESTORE = 50

const CLASS_BONUS_CATEGORY: Record<PlayerClass, HabitCategory | null> = {
  guerreiro: 'fisico',
  mago: 'mente',
  paladino: null,
}

/**
 * XP acumulado necessário para alcançar `level`. Nível 1 é fixado em 0 por convenção
 * (todo jogador começa com 0 XP) — a fórmula 100×N^1.5 só se aplica a partir do nível 2,
 * conforme a tabela em docs/01-regras-gamificacao.md.
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.round(100 * level ** 1.5)
}

export function levelForXp(xp: number): number {
  let level = 1
  while (xp >= xpForLevel(level + 1)) level++
  return level
}

/** Streak count -> XP multiplier, per docs/01-regras-gamificacao.md section 2.1 */
export function streakMultiplier(streak: number): number {
  if (streak >= 35) return 2.0
  if (streak >= 21) return 1.7
  if (streak >= 14) return 1.4
  if (streak >= 7) return 1.2
  return 1.0
}

function classTier(level: number): 0 | 1 | 2 {
  if (level >= 30) return 2
  if (level >= 15) return 1
  return 0
}

/** Class XP bonus multiplier for a habit's category (Guerreiro/Mago only) */
export function classXpMultiplier(category: HabitCategory, playerClass: PlayerClass | null, level: number): number {
  if (!playerClass || level < 5) return 1
  if (CLASS_BONUS_CATEGORY[playerClass] !== category) return 1
  const bonusByTier = [0.15, 0.2, 0.25]
  return 1 + bonusByTier[classTier(level)]
}

/** HP-loss reduction factor for Paladino (and sub-evolutions); 1 = no reduction */
export function classHpReductionFactor(playerClass: PlayerClass | null, level: number): number {
  if (playerClass !== 'paladino' || level < 5) return 1
  const factorByTier = [0.5, 0.4, 0.3]
  return factorByTier[classTier(level)]
}

export function computeCheckinXp(
  difficulty: HabitDifficulty,
  streakBeforeCheckin: number,
  category: HabitCategory,
  playerClass: PlayerClass | null,
  level: number,
): number {
  const base = DIFFICULTY_XP[difficulty]
  const mult = streakMultiplier(streakBeforeCheckin) * classXpMultiplier(category, playerClass, level)
  return Math.round(base * mult)
}

export function computeHpLoss(difficulty: HabitDifficulty, playerClass: PlayerClass | null, level: number): number {
  const base = DIFFICULTY_HP_LOSS[difficulty]
  return Math.round(base * classHpReductionFactor(playerClass, level))
}

/** Flat gold for a check-in — no streak or class multiplier, by design (docs section 8). */
export function computeCheckinGold(difficulty: HabitDifficulty): number {
  return DIFFICULTY_GOLD[difficulty]
}

export function missionXpReward(difficulty: HabitDifficulty): number {
  return DIFFICULTY_XP[difficulty] * MISSION_REWARD_MULTIPLIER
}

export function missionGoldReward(difficulty: HabitDifficulty): number {
  return DIFFICULTY_GOLD[difficulty] * MISSION_REWARD_MULTIPLIER
}

export interface ClassInfo {
  base: PlayerClass | null
  label: string
  gradient: string
}

const CLASS_TIER_LABELS: Record<PlayerClass, string[]> = {
  guerreiro: ['Guerreiro', 'Cavaleiro', 'Campeão'],
  mago: ['Mago', 'Arcanista', 'Arquimago'],
  paladino: ['Paladino', 'Templário', 'Cruzado'],
}

const CLASS_GRADIENTS: Record<PlayerClass, string> = {
  guerreiro: 'from-orange-400 via-red-500 to-rose-600',
  mago: 'from-sky-400 via-blue-500 to-indigo-600',
  paladino: 'from-fuchsia-400 via-purple-500 to-violet-600',
}

export function getClassInfo(base: PlayerClass | null, level: number): ClassInfo {
  if (!base || level < 5) {
    return { base: null, label: 'Novato', gradient: 'from-zinc-400 to-zinc-600' }
  }
  return {
    base,
    label: CLASS_TIER_LABELS[base][classTier(level)],
    gradient: CLASS_GRADIENTS[base],
  }
}
