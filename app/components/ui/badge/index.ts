import { type VariantProps, cva } from 'class-variance-authority'

export { default as Badge } from './Badge.vue'

export const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/15 text-primary',
        secondary: 'border-white/10 bg-white/5 text-muted-foreground',
        outline: 'border-white/15 text-foreground',
        success: 'border-transparent bg-emerald-500/15 text-emerald-400',
        warning: 'border-transparent bg-amber-500/15 text-amber-400',
        danger: 'border-transparent bg-red-500/15 text-red-400',
        fisico: 'border-transparent bg-orange-500/15 text-orange-400',
        mente: 'border-transparent bg-sky-500/15 text-sky-400',
        disciplina: 'border-transparent bg-violet-500/15 text-violet-400',
        social: 'border-transparent bg-pink-500/15 text-pink-400',
        criatividade: 'border-transparent bg-emerald-500/15 text-emerald-400',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export type BadgeVariants = VariantProps<typeof badgeVariants>
