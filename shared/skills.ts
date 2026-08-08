import type { PlayerClass } from './types'

export type SkillPath = 'a' | 'b'

export interface Skill {
  id: string
  playerClass: PlayerClass
  path: SkillPath
  pathLabel: string
  tier: 1 | 2 | 3
  name: string
  description: string
  cost: number
}

export const ROOT_PASSIVES: Record<PlayerClass, { name: string; description: string }> = {
  guerreiro: { name: 'Sangue Quente', description: '+5% de XP base em hábitos Físicos' },
  mago: { name: 'Foco Arcano', description: '+5% de XP base em hábitos de Mente' },
  paladino: { name: 'Aura Sagrada', description: 'Reduz toda perda de HP em 5%' },
}

export const SKILLS: Skill[] = [
  // Guerreiro — Berserker (XP e risco)
  {
    id: 'guerreiro_adrenalina',
    playerClass: 'guerreiro',
    path: 'a',
    pathLabel: 'Berserker',
    tier: 1,
    name: 'Adrenalina',
    description: 'Os limiares de sequência (7/14/21/35 dias) ficam 20% menores — os bônus de streak chegam mais cedo.',
    cost: 1,
  },
  {
    id: 'guerreiro_furia_cega',
    playerClass: 'guerreiro',
    path: 'a',
    pathLabel: 'Berserker',
    tier: 2,
    name: 'Fúria Cega',
    description: 'XP base de hábitos Difíceis sobe de 35 para 50 — mas perder um hábito Fácil tira o dobro de HP.',
    cost: 3,
  },
  {
    id: 'guerreiro_tudo_ou_nada',
    playerClass: 'guerreiro',
    path: 'a',
    pathLabel: 'Berserker',
    tier: 3,
    name: 'Tudo ou Nada',
    description: 'Bônus de dia perfeito (XP e ouro) triplicado — mas uma recaída só restaura 1 HP em vez de 50.',
    cost: 5,
  },
  // Guerreiro — Senhor da Guerra (ouro e missões)
  {
    id: 'guerreiro_saqueador',
    playerClass: 'guerreiro',
    path: 'b',
    pathLabel: 'Senhor da Guerra',
    tier: 1,
    name: 'Saqueador',
    description: 'Todo check-in em hábito Físico rende +3 de ouro extra.',
    cost: 1,
  },
  {
    id: 'guerreiro_tributo',
    playerClass: 'guerreiro',
    path: 'b',
    pathLabel: 'Senhor da Guerra',
    tier: 2,
    name: 'Tributo',
    description: 'Missões pagam +50% de ouro.',
    cost: 3,
  },
  {
    id: 'guerreiro_mercenario',
    playerClass: 'guerreiro',
    path: 'b',
    pathLabel: 'Senhor da Guerra',
    tier: 3,
    name: 'Mercenário',
    description: 'Completar uma missão dá de brinde 1 Poção de Vida Pequena, além da recompensa normal.',
    cost: 5,
  },
  // Mago — Arquimago (Grimório)
  {
    id: 'mago_leitura_dinamica',
    playerClass: 'mago',
    path: 'a',
    pathLabel: 'Arquimago',
    tier: 1,
    name: 'Leitura Dinâmica',
    description: 'Derrotar o Chefe de Conhecimento (3/3 acertos) também rende ouro, além do XP normal.',
    cost: 1,
  },
  {
    id: 'mago_clarividencia',
    playerClass: 'mago',
    path: 'a',
    pathLabel: 'Arquimago',
    tier: 2,
    name: 'Clarividência',
    description: 'A primeira vez que você erra uma pergunta numa Batalha, não perde HP.',
    cost: 3,
  },
  {
    id: 'mago_manipulacao_destino',
    playerClass: 'mago',
    path: 'a',
    pathLabel: 'Arquimago',
    tier: 3,
    name: 'Manipulação do Destino',
    description: 'Uma vez por Batalha, o efeito do Olho da Visão Verdadeira é de graça, sem gastar inventário.',
    cost: 5,
  },
  // Mago — Alquimista (consumíveis)
  {
    id: 'mago_metabolismo_magico',
    playerClass: 'mago',
    path: 'b',
    pathLabel: 'Alquimista',
    tier: 1,
    name: 'Metabolismo Mágico',
    description: 'Todas as Poções de Vida curam 25% a mais de HP.',
    cost: 1,
  },
  {
    id: 'mago_barganha_arcana',
    playerClass: 'mago',
    path: 'b',
    pathLabel: 'Alquimista',
    tier: 2,
    name: 'Barganha Arcana',
    description: 'Olho da Visão, Escudo de Cristal e Elixir do Erudito custam 20% menos na Taverna.',
    cost: 3,
  },
  {
    id: 'mago_transmutacao',
    playerClass: 'mago',
    path: 'b',
    pathLabel: 'Alquimista',
    tier: 3,
    name: 'Transmutação',
    description: '15% de chance de um consumível não ser gasto do inventário ao ser usado.',
    cost: 5,
  },
  // Paladino — Guardião (escudos e defesa)
  {
    id: 'paladino_armadura_reforcada',
    playerClass: 'paladino',
    path: 'a',
    pathLabel: 'Guardião',
    tier: 1,
    name: 'Armadura Reforçada',
    description: 'O teto de escudos acumuláveis sobe de 3 para 5.',
    cost: 1,
  },
  {
    id: 'paladino_baluarte',
    playerClass: 'paladino',
    path: 'a',
    pathLabel: 'Guardião',
    tier: 2,
    name: 'Baluarte',
    description:
      'Quando um Escudo quebra protegendo um hábito, você ganha o XP base daquele hábito. (Depende do uso real de escudo pra proteger um hábito, que ainda não existe no app — fica registrado pra quando essa mecânica for construída.)',
    cost: 3,
  },
  {
    id: 'paladino_graca_estalagem',
    playerClass: 'paladino',
    path: 'a',
    pathLabel: 'Guardião',
    tier: 3,
    name: 'Graça da Estalagem',
    description: 'O Ticket da Estalagem também regenera 25 de HP no fechamento do dia.',
    cost: 5,
  },
  // Paladino — Cruzado (recuperação)
  {
    id: 'paladino_penitencia',
    playerClass: 'paladino',
    path: 'b',
    pathLabel: 'Cruzado',
    tier: 1,
    name: 'Penitência',
    description: 'Fazer check-in num hábito cujo streak quebrou ontem cura +3 de HP.',
    cost: 1,
  },
  {
    id: 'paladino_fenix',
    playerClass: 'paladino',
    path: 'b',
    pathLabel: 'Cruzado',
    tier: 2,
    name: 'Fênix',
    description: 'Uma recaída restaura 80 de HP em vez de 50.',
    cost: 3,
  },
  {
    id: 'paladino_voto_disciplina',
    playerClass: 'paladino',
    path: 'b',
    pathLabel: 'Cruzado',
    tier: 3,
    name: 'Voto de Disciplina',
    description: 'Com HP abaixo de 30%, todo XP e ouro de check-in vem multiplicado por 1.5x.',
    cost: 5,
  },
]

export function hasSkill(skills: readonly string[], skillId: string): boolean {
  return skills.includes(skillId)
}

export function getSkill(skillId: string): Skill | undefined {
  return SKILLS.find((s) => s.id === skillId)
}

/** The skill one tier below `skill` in the same class+path, if any — tier 1 has none. */
export function getPrerequisiteSkillId(skill: Skill): string | undefined {
  if (skill.tier <= 1) return undefined
  return SKILLS.find((s) => s.playerClass === skill.playerClass && s.path === skill.path && s.tier === skill.tier - 1)?.id
}
