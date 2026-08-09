import type { ItemAccent } from './economy'

export type CosmeticCategory = 'titulo' | 'borda' | 'tema'

export interface CosmeticItem {
  id: string
  category: CosmeticCategory
  name: string
  description: string
  cost: number
  accent: ItemAccent
}

/** Shared solid accent for titles that don't name a color themselves — see ItemAccent. */
const TITLE_ACCENT: ItemAccent = { kind: 'solid', className: 'bg-violet-600' }

/** The two high-cost "gold sink" cosmetics (ver GAMEPLAY.md) — a pearlescent, out-of-palette
 * treatment (neither Dourada's amber nor Platina's plain silver) plus a small glow contained
 * to the badge, so they read as visually exclusive before the price is even read. */
const PRESTIGE_ACCENT: ItemAccent = {
  kind: 'prestige',
  className: 'bg-gradient-to-br from-slate-50 via-amber-200 to-slate-50',
  glowClassName: 'shadow-[0_0_16px_rgba(252,211,77,0.5)]',
}

export const TITLES: CosmeticItem[] = [
  { id: 'implacavel', category: 'titulo', name: 'O Implacável', description: 'Exibido embaixo do seu nome', cost: 150, accent: TITLE_ACCENT },
  {
    id: 'lenda_disciplina',
    category: 'titulo',
    name: 'Lenda da Disciplina',
    description: 'Exibido embaixo do seu nome',
    cost: 300,
    accent: TITLE_ACCENT,
  },
  { id: 'mago_foco', category: 'titulo', name: 'Mago do Foco', description: 'Exibido embaixo do seu nome', cost: 300, accent: TITLE_ACCENT },
  {
    id: 'lenda_viva',
    category: 'titulo',
    name: 'Lenda Viva',
    description: 'Título de prestígio, sem outro efeito além de exibir quanto ouro você já acumulou',
    cost: 2500,
    accent: PRESTIGE_ACCENT,
  },
]

export const BORDERS: CosmeticItem[] = [
  {
    id: 'dourada',
    category: 'borda',
    name: 'Borda Dourada',
    description: 'Um contorno dourado para o seu avatar',
    cost: 150,
    accent: { kind: 'gradient', className: 'bg-gradient-to-br from-amber-300 to-yellow-600' },
  },
  {
    id: 'chamas',
    category: 'borda',
    name: 'Borda de Chamas',
    description: 'Um contorno em tons de fogo para o seu avatar',
    cost: 200,
    accent: { kind: 'gradient', className: 'bg-gradient-to-br from-orange-400 to-red-600' },
  },
  {
    id: 'gelo',
    category: 'borda',
    name: 'Borda de Gelo',
    description: 'Um contorno gelado para o seu avatar',
    cost: 200,
    accent: { kind: 'gradient', className: 'bg-gradient-to-br from-cyan-300 to-blue-500' },
  },
  {
    id: 'prata',
    category: 'borda',
    name: 'Borda de Prata',
    description: 'Um contorno prateado e elegante para o seu avatar',
    cost: 150,
    // Lighter start stop than a plain slate gradient on purpose — "prata" reads as dull without
    // a bit of extra luminosity.
    accent: { kind: 'gradient', className: 'bg-gradient-to-br from-slate-100 to-slate-400' },
  },
  {
    id: 'safira',
    category: 'borda',
    name: 'Borda de Safira',
    description: 'Um contorno azul safira para o seu avatar',
    cost: 200,
    accent: { kind: 'gradient', className: 'bg-gradient-to-br from-blue-400 to-indigo-600' },
  },
  {
    id: 'arco_iris',
    category: 'borda',
    name: 'Borda Arco-Íris',
    description: 'Um anel colorido girando ao redor do seu avatar',
    cost: 400,
    // Same stops as .border-anim-rainbow (the actual equipped effect), just static for the badge.
    accent: { kind: 'gradient', className: 'bg-[linear-gradient(135deg,#f43f5e,#f59e0b,#eab308,#22c55e,#06b6d4,#6366f1,#d946ef)]' },
  },
  {
    id: 'pulsante',
    category: 'borda',
    name: 'Aura Pulsante',
    description: 'Um brilho que pulsa ao redor do seu avatar',
    cost: 350,
    // "Pulsante" has no color of its own — the real effect pulses in whatever theme is
    // equipped (hsl(var(--primary)), see .border-anim-pulse below), so the badge mirrors that.
    accent: { kind: 'solid', className: 'bg-primary' },
  },
]

export const THEMES: CosmeticItem[] = [
  {
    id: 'ouro',
    category: 'tema',
    name: 'Tema Ouro',
    description: 'Troca a cor de destaque do app para dourado',
    cost: 250,
    accent: { kind: 'gradient', className: 'bg-gradient-to-br from-yellow-400 to-amber-600' },
  },
  {
    id: 'vermelho_sangue',
    category: 'tema',
    name: 'Tema Vermelho Sangue',
    description: 'Troca a cor de destaque do app para vermelho',
    cost: 250,
    accent: { kind: 'gradient', className: 'bg-gradient-to-br from-red-500 to-red-900' },
  },
  {
    id: 'verde_esmeralda',
    category: 'tema',
    name: 'Tema Verde Esmeralda',
    description: 'Troca a cor de destaque do app para verde',
    cost: 250,
    accent: { kind: 'gradient', className: 'bg-gradient-to-br from-emerald-400 to-green-700' },
  },
  {
    id: 'azul_safira',
    category: 'tema',
    name: 'Tema Azul Safira',
    description: 'Troca a cor de destaque do app para azul',
    cost: 250,
    accent: { kind: 'gradient', className: 'bg-gradient-to-br from-blue-400 to-indigo-700' },
  },
  {
    id: 'rosa_choque',
    category: 'tema',
    name: 'Tema Rosa Choque',
    description: 'Troca a cor de destaque do app para rosa',
    cost: 250,
    accent: { kind: 'gradient', className: 'bg-gradient-to-br from-pink-400 to-fuchsia-600' },
  },
  {
    id: 'ciano',
    category: 'tema',
    name: 'Tema Ciano',
    description: 'Troca a cor de destaque do app para ciano',
    cost: 250,
    accent: { kind: 'gradient', className: 'bg-gradient-to-br from-cyan-300 to-teal-600' },
  },
  {
    id: 'ametista',
    category: 'tema',
    name: 'Tema Ametista',
    description: 'Troca a cor de destaque do app para um roxo mais intenso',
    cost: 250,
    accent: { kind: 'gradient', className: 'bg-gradient-to-br from-purple-400 to-violet-700' },
  },
  {
    id: 'platina',
    category: 'tema',
    name: 'Tema Platina',
    description: 'Tema de prestígio em tons prateados, para quem já tem ouro sobrando',
    cost: 2000,
    accent: PRESTIGE_ACCENT,
  },
]

export const COSMETIC_ITEMS: CosmeticItem[] = [...TITLES, ...BORDERS, ...THEMES]

/** HSL "H S% L%" pairs matching the format used in app/assets/css/tailwind.css */
export const THEME_COLORS: Record<string, { primary: string; ring: string; background: string; card: string }> = {
  ouro: { primary: '43 96% 56%', ring: '43 96% 56%', background: '43 25% 5%', card: '43 18% 9%' },
  vermelho_sangue: { primary: '0 72% 51%', ring: '0 72% 51%', background: '0 25% 5%', card: '0 18% 9%' },
  verde_esmeralda: { primary: '152 69% 40%', ring: '152 69% 40%', background: '152 25% 5%', card: '152 18% 9%' },
  azul_safira: { primary: '217 91% 60%', ring: '217 91% 60%', background: '217 25% 5%', card: '217 18% 9%' },
  rosa_choque: { primary: '330 81% 60%', ring: '330 81% 60%', background: '330 25% 5%', card: '330 18% 9%' },
  ciano: { primary: '189 94% 43%', ring: '189 94% 43%', background: '189 25% 5%', card: '189 18% 9%' },
  ametista: { primary: '289 73% 47%', ring: '289 73% 47%', background: '289 25% 5%', card: '289 18% 9%' },
  platina: { primary: '210 15% 75%', ring: '210 15% 75%', background: '210 10% 5%', card: '210 8% 9%' },
}

export type BorderStyle = { kind: 'ring'; className: string } | { kind: 'gradient'; className: string }

/**
 * 'ring' borders are a plain colored ring (box-shadow) on the avatar itself.
 * 'gradient' borders need an unclipped wrapper element — see ClassAvatar.vue —
 * because their effect is a CSS ::before pseudo-element that extends past the circle.
 */
export const BORDER_STYLES: Record<string, BorderStyle> = {
  dourada: { kind: 'ring', className: 'ring-4 ring-amber-400/80' },
  chamas: { kind: 'ring', className: 'ring-4 ring-orange-500/80' },
  gelo: { kind: 'ring', className: 'ring-4 ring-sky-300/80' },
  prata: { kind: 'ring', className: 'ring-4 ring-slate-300/80' },
  safira: { kind: 'ring', className: 'ring-4 ring-blue-400/80' },
  arco_iris: { kind: 'gradient', className: 'border-anim-rainbow' },
  pulsante: { kind: 'gradient', className: 'border-anim-pulse' },
}
