import type { HabitCategory, HabitDifficulty, PlayerClass } from './types'
import { hasSkill } from './skills'

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
export const GRIMOIRE_BOSS_GOLD = 50
export const GRIMOIRE_HP_LOSS_PERCENT = 0.1
export const GRIMOIRE_MIN_LENGTH = 100
export const GRIMOIRE_MAX_LENGTH = 12000
export const GRIMOIRE_MAX_LENGTH_BOOSTED = 30000

/** XP for a finished Grimório battle, proportional to accuracy (docs section 12.2). */
export function grimoireXpReward(correctCount: number): number {
  return Math.round((GRIMOIRE_BOSS_XP * correctCount) / GRIMOIRE_QUIZ_LENGTH)
}

/** Gold for a finished Grimório battle — only awarded with the Leitura Dinâmica skill. */
export function grimoireGoldReward(correctCount: number): number {
  return Math.round((GRIMOIRE_BOSS_GOLD * correctCount) / GRIMOIRE_QUIZ_LENGTH)
}

/**
 * HP lost per wrong answer in a Grimório battle — 10% of max HP, doubled when the battle
 * is XP-boosted (Elixir do Erudito): more reward, more risk, on purpose (balanceamento.txt #2).
 */
export function grimoireHpLoss(xpBoosted: boolean): number {
  const base = Math.round(HP_MAX * GRIMOIRE_HP_LOSS_PERCENT)
  return xpBoosted ? base * 2 : base
}

export const PERFECT_DAY_XP_BONUS = 15
export const PERFECT_DAY_GOLD_BONUS = 10
export const HP_REGEN_PERFECT_DAY = 5
export const HP_MAX = 100
export const HP_INITIAL = 100
export const RELAPSE_HP_RESTORE = 50

/** Habit streak (days) at which a habit is considered "mastered" — see balanceamento.txt #4. */
export const HABIT_DOMINATED_STREAK = 100
/** Flat XP for first reaching HABIT_DOMINATED_STREAK — same value as a "difícil" mission. */
export const HABIT_DOMINATED_BONUS_XP = 105

/**
 * Relapse now removes a percentage of current XP (capped), instead of dropping straight to
 * the previous level's floor — see balanceamento.txt #3 (a flat level loss is nearly free at
 * low levels and devastating at high ones).
 */
export const RELAPSE_XP_LOSS_PERCENT = 0.15
export const RELAPSE_XP_LOSS_CAP = 500

export function computeRelapseXp(currentXp: number): number {
  const loss = Math.min(currentXp * RELAPSE_XP_LOSS_PERCENT, RELAPSE_XP_LOSS_CAP)
  return Math.max(0, Math.round(currentXp - loss))
}

/** How much HP a relapse restores — modified by Tudo ou Nada (Guerreiro) or Fênix (Paladino). */
export function getRelapseHpRestore(skills: readonly string[] = []): number {
  if (hasSkill(skills, 'guerreiro_tudo_ou_nada')) return 1
  if (hasSkill(skills, 'paladino_fenix')) return 80
  return RELAPSE_HP_RESTORE
}

/** Skill points available: 1 per level past 4, minus however many are already unlocked. */
export function getAvailableSP(level: number, unlockedCount: number): number {
  return Math.max(0, level - 4) - unlockedCount
}

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

/** Streak count -> XP multiplier, per docs/01-regras-gamificacao.md section 2.1. Adrenalina (Guerreiro) lowers the thresholds by 20%. */
export function streakMultiplier(streak: number, skills: readonly string[] = []): number {
  const t = hasSkill(skills, 'guerreiro_adrenalina') ? 0.8 : 1
  if (streak >= 35 * t) return 2.0
  if (streak >= 21 * t) return 1.7
  if (streak >= 14 * t) return 1.4
  if (streak >= 7 * t) return 1.2
  return 1.0
}

function classTier(level: number): 0 | 1 | 2 {
  if (level >= 30) return 2
  if (level >= 15) return 1
  return 0
}

/**
 * Class XP bonus multiplier for a habit's category (Guerreiro/Mago only) — includes the
 * root passive (Sangue Quente / Foco Arcano, +5%) which is automatic once the class is chosen,
 * on top of the tiered class bonus.
 */
export function classXpMultiplier(category: HabitCategory, playerClass: PlayerClass | null, level: number): number {
  if (!playerClass || level < 5) return 1
  if (CLASS_BONUS_CATEGORY[playerClass] !== category) return 1
  const bonusByTier = [0.15, 0.2, 0.25]
  const rootPassiveBonus = 0.05
  return 1 + rootPassiveBonus + bonusByTier[classTier(level)]
}

/** HP-loss reduction factor for Paladino (and sub-evolutions); 1 = no reduction. Includes Aura Sagrada (-5%, automatic). */
export function classHpReductionFactor(playerClass: PlayerClass | null, level: number): number {
  if (playerClass !== 'paladino' || level < 5) return 1
  const factorByTier = [0.5, 0.4, 0.3]
  const rootPassiveFactor = 0.95
  return factorByTier[classTier(level)] * rootPassiveFactor
}

export function computeCheckinXp(
  difficulty: HabitDifficulty,
  streakBeforeCheckin: number,
  category: HabitCategory,
  playerClass: PlayerClass | null,
  level: number,
  skills: readonly string[] = [],
  hpRatio?: number,
): number {
  const base = difficulty === 'dificil' && hasSkill(skills, 'guerreiro_furia_cega') ? 50 : DIFFICULTY_XP[difficulty]
  const mult = streakMultiplier(streakBeforeCheckin, skills) * classXpMultiplier(category, playerClass, level)
  let xp = Math.round(base * mult)
  if (hasSkill(skills, 'paladino_voto_disciplina') && hpRatio !== undefined && hpRatio < 0.3) {
    xp = Math.round(xp * 1.5)
  }
  return xp
}

export function computeHpLoss(
  difficulty: HabitDifficulty,
  playerClass: PlayerClass | null,
  level: number,
  skills: readonly string[] = [],
): number {
  let base = DIFFICULTY_HP_LOSS[difficulty]
  if (difficulty === 'facil' && hasSkill(skills, 'guerreiro_furia_cega')) base *= 2
  return Math.round(base * classHpReductionFactor(playerClass, level))
}

/** Flat gold for a check-in — no streak or class multiplier, by design (docs section 8). Saqueador/Voto de Disciplina modify it. */
export function computeCheckinGold(
  difficulty: HabitDifficulty,
  category: HabitCategory,
  skills: readonly string[] = [],
  hpRatio?: number,
): number {
  let gold = DIFFICULTY_GOLD[difficulty]
  if (category === 'fisico' && hasSkill(skills, 'guerreiro_saqueador')) gold += 3
  if (hasSkill(skills, 'paladino_voto_disciplina') && hpRatio !== undefined && hpRatio < 0.3) {
    gold = Math.round(gold * 1.5)
  }
  return gold
}

export function missionXpReward(difficulty: HabitDifficulty): number {
  return DIFFICULTY_XP[difficulty] * MISSION_REWARD_MULTIPLIER
}

/** Base mission gold reward, stored on the mission at creation — Tributo's +50% is applied at completion time (complete.post.ts), not here, so it reflects skills owned when the reward is claimed rather than when the mission was written. */
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
