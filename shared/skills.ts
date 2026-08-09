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
  arqueiro: { name: 'Olho de Falcão', description: '+5 pontos percentuais no bônus do Tiro Certeiro' },
  ladino: { name: 'Instinto', description: '+5 pontos percentuais na chance de Golpe Duplo' },
  bardo: { name: 'Voz Encantadora', description: '+5% de XP base em hábitos Sociais' },
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
    description: 'Quando um Escudo protege a sequência de um hábito, você ganha o XP base daquele hábito.',
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
  // Arqueiro — Tiro Certeiro (o próprio bônus fixo de streak)
  {
    id: 'arqueiro_fluxo_constante',
    playerClass: 'arqueiro',
    path: 'a',
    pathLabel: 'Tiro Certeiro',
    tier: 1,
    name: 'Fluxo Constante',
    description: 'O Tiro Certeiro passa a disparar a cada 4 check-ins consecutivos, em vez de 5.',
    cost: 1,
  },
  {
    id: 'arqueiro_ponto_fraco',
    playerClass: 'arqueiro',
    path: 'a',
    pathLabel: 'Tiro Certeiro',
    tier: 2,
    name: 'Ponto Fraco',
    description: 'O bônus do Tiro Certeiro sobe de 50% para 80% do XP base da dificuldade.',
    cost: 3,
  },
  {
    id: 'arqueiro_disparo_perfeito',
    playerClass: 'arqueiro',
    path: 'a',
    pathLabel: 'Tiro Certeiro',
    tier: 3,
    name: 'Disparo Perfeito',
    description: 'Um Dia Perfeito também dispara um Tiro Certeiro extra, mesmo fora da contagem de streak.',
    cost: 5,
  },
  // Arqueiro — Caçador (ouro e missões)
  {
    id: 'arqueiro_provisoes',
    playerClass: 'arqueiro',
    path: 'b',
    pathLabel: 'Caçador',
    tier: 1,
    name: 'Provisões',
    description: 'Todo check-in em hábito de Disciplina rende +3 de ouro extra.',
    cost: 1,
  },
  {
    id: 'arqueiro_corda_extra',
    playerClass: 'arqueiro',
    path: 'b',
    pathLabel: 'Caçador',
    tier: 2,
    name: 'Corda Extra',
    description: 'Ampulheta do Tempo e Ticket da Estalagem custam 20% menos na Taverna.',
    cost: 3,
  },
  {
    id: 'arqueiro_ultima_flecha',
    playerClass: 'arqueiro',
    path: 'b',
    pathLabel: 'Caçador',
    tier: 3,
    name: 'Última Flecha',
    description: 'Completar uma missão de Disciplina dá de brinde 1 Poção de Vida Pequena, além da recompensa normal.',
    cost: 5,
  },
  // Ladino — Golpe Duplo (sorte e crítico)
  {
    id: 'ladino_mao_leve',
    playerClass: 'ladino',
    path: 'a',
    pathLabel: 'Golpe Duplo',
    tier: 1,
    name: 'Mão Leve',
    description: '+5 pontos percentuais na chance de Golpe Duplo.',
    cost: 1,
  },
  {
    id: 'ladino_pratica',
    playerClass: 'ladino',
    path: 'a',
    pathLabel: 'Golpe Duplo',
    tier: 2,
    name: 'Prática',
    description: '+8 pontos percentuais na chance de Golpe Duplo (cumulativo com Mão Leve).',
    cost: 3,
  },
  {
    id: 'ladino_fintar_destino',
    playerClass: 'ladino',
    path: 'a',
    pathLabel: 'Golpe Duplo',
    tier: 3,
    name: 'Fintar o Destino',
    description: 'Cada resposta errada no Grimório tem 25% de chance de não contar como erro — sem limite por batalha.',
    cost: 5,
  },
  // Ladino — Trapaça (economia e risco)
  {
    id: 'ladino_bolsos_cheios',
    playerClass: 'ladino',
    path: 'b',
    pathLabel: 'Trapaça',
    tier: 1,
    name: 'Bolsos Cheios',
    description: 'Poções de Vida custam 15% menos na Taverna.',
    cost: 1,
  },
  {
    id: 'ladino_mao_rapida',
    playerClass: 'ladino',
    path: 'b',
    pathLabel: 'Trapaça',
    tier: 2,
    name: 'Mão Rápida',
    description: 'Missões de categoria Criatividade pagam +50% de ouro.',
    cost: 3,
  },
  {
    id: 'ladino_aposta_alta',
    playerClass: 'ladino',
    path: 'b',
    pathLabel: 'Trapaça',
    tier: 3,
    name: 'Aposta Alta',
    description:
      'Opcional ao iniciar uma Batalha do Grimório: dobra a perda de HP por erro, mas também dobra o XP e o ouro ganhos na vitória.',
    cost: 5,
  },
  // Bardo — Segunda Voz (sequência e ritmo)
  {
    id: 'bardo_refrao_curto',
    playerClass: 'bardo',
    path: 'a',
    pathLabel: 'Segunda Voz',
    tier: 1,
    name: 'Refrão Curto',
    description: 'Os limiares de sequência (7/14/21/35 dias) ficam 10% menores — os bônus de streak chegam mais cedo.',
    cost: 1,
  },
  {
    id: 'bardo_refrao',
    playerClass: 'bardo',
    path: 'a',
    pathLabel: 'Segunda Voz',
    tier: 2,
    name: 'Refrão',
    description: 'A Segunda Voz (sequência quebrada vira metade em vez de zero) passa a valer para qualquer categoria de hábito, não só Social.',
    cost: 3,
  },
  {
    id: 'bardo_show_deve_continuar',
    playerClass: 'bardo',
    path: 'a',
    pathLabel: 'Segunda Voz',
    tier: 3,
    name: 'Show Deve Continuar',
    description: 'Um Dia Perfeito rende o dobro de XP e ouro — no máximo uma vez por semana.',
    cost: 5,
  },
  // Bardo — Performance (ouro e recuperação)
  {
    id: 'bardo_aplausos',
    playerClass: 'bardo',
    path: 'b',
    pathLabel: 'Performance',
    tier: 1,
    name: 'Aplausos',
    description: 'Todo check-in em hábito Social rende +3 de ouro extra.',
    cost: 1,
  },
  {
    id: 'bardo_boa_fama',
    playerClass: 'bardo',
    path: 'b',
    pathLabel: 'Performance',
    tier: 2,
    name: 'Boa Fama',
    description: 'Missões de categoria Social pagam +50% de ouro.',
    cost: 3,
  },
  {
    id: 'bardo_ultima_cancao',
    playerClass: 'bardo',
    path: 'b',
    pathLabel: 'Performance',
    tier: 3,
    name: 'Última Canção',
    description: 'O Ticket da Estalagem também regenera 15 de HP no fechamento do dia.',
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
