export type HabitCategory = 'fisico' | 'mente' | 'disciplina' | 'social' | 'criatividade'
export type HabitDifficulty = 'facil' | 'medio' | 'dificil'
export type HabitFrequency = 'diaria' | 'semanal' | 'dias_customizados'
export type HabitStatus = 'ativo' | 'pausado' | 'arquivado'
export type PlayerClass = 'guerreiro' | 'mago' | 'paladino'
export type MissionStatus = 'ativa' | 'concluida' | 'cancelada'
export type GrimoireStatus = 'gerado' | 'concluida'

export const categoryLabel: Record<HabitCategory, string> = {
  fisico: 'Físico',
  mente: 'Mente',
  disciplina: 'Disciplina',
  social: 'Social',
  criatividade: 'Criatividade',
}

export const difficultyLabel: Record<HabitDifficulty, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
}

export const attributeLabel: Record<HabitCategory, string> = {
  fisico: 'Força',
  mente: 'Inteligência',
  disciplina: 'Sabedoria',
  social: 'Carisma',
  criatividade: 'Destreza',
}

export const attributeAbbr: Record<HabitCategory, string> = {
  fisico: 'STR',
  mente: 'INT',
  disciplina: 'WIS',
  social: 'CHA',
  criatividade: 'DEX',
}

export interface HabitDTO {
  id: string
  name: string
  category: HabitCategory
  difficulty: HabitDifficulty
  frequency: HabitFrequency
  status: HabitStatus
  streakCount: number
  longestStreak: number
  doneToday: boolean
}

export interface UserStateDTO {
  name: string
  level: number
  xp: number
  hp: number
  gold: number
  playerClass: PlayerClass | null
  shieldsRemaining: number
  xpFloor: number
  xpCeil: number
}

export interface MissionDTO {
  id: string
  title: string
  description: string | null
  difficulty: HabitDifficulty
  xpReward: number
  goldReward: number
  status: MissionStatus
  createdAt: string
}

export interface AttributeStatsDTO {
  category: HabitCategory
  xp: number
}

export interface DailyClosureResultDTO {
  closureDate: string
  perfectDay: boolean
  relapsed: boolean
  xpChange: number
  hpChange: number
  goldChange: number
}

/** Quiz question as sent to the client — never includes the answer key. */
export interface PublicQuizQuestionDTO {
  question: string
  options: string[]
}

export interface GrimoireAnswerRecordDTO {
  questionIndex: number
  selectedOption: number
  correct: boolean
}

export interface GrimoireSessionDTO {
  id: string
  summary: string
  quiz: PublicQuizQuestionDTO[]
  answers: GrimoireAnswerRecordDTO[]
  status: GrimoireStatus
  correctCount: number | null
  xpAwarded: number | null
  createdAt: string
}

export interface GrimoireAnswerResultDTO {
  correct: boolean
  correctIndex: number
  explanation: string
  hp: number
  relapsed: boolean
  battleComplete: boolean
  xpAwarded: number | null
  correctCount: number | null
  level: number
  leveledUp: boolean
}
