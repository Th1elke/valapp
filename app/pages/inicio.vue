<script setup lang="ts">
import { ArrowRight, BookOpen, Flame, Heart, LogIn, Music2, Shield, Sparkles, Swords, Target, VenetianMask, Wand2 } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'

definePageMeta({ layout: 'landing' })

const navLinks = [
  { href: '#como-funciona', label: 'As Regras do Jogo' },
  { href: '#classes', label: 'Classes' },
  { href: '#grimorio', label: 'Grimório' },
]

// Ícones ficam soltos por enquanto (sem chip/fundo) — troca por imagens em /img quando
// os ícones customizados chegarem.
const classes = [
  { icon: Swords, name: 'Guerreiro' },
  { icon: Wand2, name: 'Mago' },
  { icon: Shield, name: 'Paladino' },
  { icon: Target, name: 'Arqueiro' },
  { icon: VenetianMask, name: 'Ladino' },
  { icon: Music2, name: 'Bardo' },
]

// Cards por classe (não tabela): com 6 classes uma tabela comparativa fica esparsa
// demais (a maioria das linhas só preenche 1-2 células). Cor de destaque só no ícone
// + um traço curto sob o nome — sem chip com fundo, sem barra de gradiente no topo.
// Paladino fica com um tom neutro de propósito: "roxo" já é a cor de marca do site.
const classCards = [
  {
    ...classes[0],
    iconClass: 'text-orange-400',
    underlineClass: 'bg-red-500',
    bullets: ['+XP em hábitos Físicos', 'Ouro extra em check-ins Físicos', 'Mais risco, mais recompensa'],
  },
  {
    ...classes[1],
    iconClass: 'text-sky-400',
    underlineClass: 'bg-blue-500',
    bullets: ['+XP em hábitos de Mente', 'Consumíveis mais baratos na Loja', 'Grimório mais seguro'],
  },
  {
    ...classes[2],
    iconClass: 'text-zinc-300',
    underlineClass: 'bg-zinc-500',
    bullets: ['Metade do dano por hábito perdido', 'Recuperação muito mais suave na recaída'],
  },
  {
    ...classes[3],
    iconClass: 'text-emerald-400',
    underlineClass: 'bg-green-500',
    bullets: ['+XP em hábitos de Disciplina', 'Bônus fixo a cada 5º check-in em sequência', 'Ouro extra em check-ins de Disciplina'],
  },
  {
    ...classes[4],
    iconClass: 'text-slate-400',
    underlineClass: 'bg-indigo-700',
    bullets: ['Chance de XP em dobro (Criatividade)', 'Poções mais baratas', 'Chance de anular um erro no Grimório'],
  },
  {
    ...classes[5],
    iconClass: 'text-amber-300',
    underlineClass: 'bg-rose-500',
    bullets: ['+XP em hábitos Sociais', 'Quebra de streak vira metade, não zero', 'Ouro extra em check-ins Sociais'],
  },
]

// Sequência escalonada do hero, só no load inicial (não dispara de novo ao rolar/voltar pra
// aba): badge → título → parágrafo → HUD → botões → painel "6 classes...". Cada etapa vira uma
// classe opacity/translate aplicada via `heroStage`, nunca um `display:none` — não há layout
// shift porque o espaço dos elementos já existe desde o primeiro paint.
const HERO_STEPS = 6
const HERO_STEP_DELAY = 130
const heroStage = ref(0)

function heroReveal(step: number) {
  return heroStage.value >= step ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
}

onMounted(() => {
  if (prefersReducedMotion()) {
    heroStage.value = HERO_STEPS
    return
  }
  for (let step = 1; step <= HERO_STEPS; step++) {
    setTimeout(() => {
      heroStage.value = step
    }, step * HERO_STEP_DELAY)
  }
})
</script>

<template>
  <div class="mx-auto overflow-x-clip px-6 pb-24">
    <header class="flex flex-wrap items-center justify-between gap-4 py-6">
      <div class="flex items-center gap-2">
        <img src="/img/logo-val.png" alt="" class="h-9 w-9" />
        <span class="text-lg font-semibold">val<span class="text-primary">.</span></span>
      </div>

      <nav class="glass-inset hidden items-center gap-1 rounded-full p-1 sm:flex">
        <a
          v-for="link in navLinks"
          :key="link.href"
          :href="link.href"
          class="rounded-full px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          {{ link.label }}
        </a>
      </nav>

      <NuxtLink
        to="/login"
        class="glass-inset flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5"
      >
        <LogIn :size="14" /> Entrar
      </NuxtLink>
    </header>

    <section class="grid items-center gap-12 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
      <div>
        <Badge variant="secondary" :class="['mb-5', 'transition-all duration-500 ease-out', heroReveal(1)]">
          RPG de hábitos, com risco de verdade
        </Badge>
        <h1 :class="['text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl', 'transition-all duration-500 ease-out', heroReveal(2)]">
          Sua rotina vira
          <span class="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">progresso de personagem</span>
        </h1>
        <p :class="['mt-5 max-w-lg text-lg text-muted-foreground', 'transition-all duration-500 ease-out', heroReveal(3)]">
          Cumpra hábitos reais pra ganhar XP, subir de nível e escolher uma classe. Ignore-os e sinta o peso: HP cai, e uma recaída de
          verdade custa caro. Sem enfeite — gamificação com consequência.
        </p>

        <!-- HUD de status: mostra a mecânica em vez de só descrever -->
        <HudPreview :class="['mt-6 max-w-md', 'transition-all duration-500 ease-out', heroReveal(4)]" />

        <div :class="['mt-8 flex items-center gap-3', 'transition-all duration-500 ease-out', heroReveal(5)]">
          <NuxtLink
            to="/registro"
            class="group flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Iniciar Jornada <ArrowRight :size="16" class="transition-transform duration-200 group-hover:translate-x-1" />
          </NuxtLink>
          <NuxtLink
            to="/login"
            title="Entrar"
            class="glass-inset flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/5"
          >
            <LogIn :size="18" />
          </NuxtLink>
        </div>

        <div :class="['mt-10 border-t border-white/10 pt-6', 'transition-all duration-500 ease-out', heroReveal(6)]">
          <div class="glass-inset flex items-center gap-3 rounded-lg p-4">
            <Sparkles :size="18" class="shrink-0 text-primary" />
            <p class="text-sm text-muted-foreground">
              6 classes, dezenas de habilidades pra desbloquear e um <strong class="text-foreground">Grimório com IA</strong> que
              transforma qualquer conteúdo de estudo em quiz.
            </p>
          </div>
        </div>
      </div>

      <div class="relative mx-auto w-full max-w-lg self-end lg:max-w-2xl">
        <!-- Ícones das classes espalhados de forma assimétrica — alguns atrás da imagem (aproveitam o
             alpha real do webp pra "espiar" por trás da capa/arco), outros na frente. Sem chip, sem cor
             própria: só o mesmo tratamento solto usado em "As Regras do Jogo". -->
        <Swords :size="30" class="pointer-events-none absolute left-[0%] top-[10%] -z-10 rotate-[-16deg] text-white/10" />
        <Shield :size="42" class="pointer-events-none absolute -right-4 top-[40%] -z-10 rotate-[9deg] text-white/[0.08]" />
        <Wand2 :size="22" class="pointer-events-none absolute bottom-[20%] left-[4%] z-10 rotate-[18deg] text-primary/25" />
        <BookOpen :size="19" class="pointer-events-none absolute right-[8%] top-[2%] z-10 hidden rotate-[-9deg] text-primary/20 sm:block" />

        <div class="relative w-full">
          <!-- Sombra de contato: ancora a personagem no "chão" em vez de um halo ao redor do corpo todo.
               O radial-gradient já tem a queda suave embutida — bg preta + blur some contra o fundo quase preto. -->
          <div
            class="absolute bottom-2 left-[40%] h-8 w-40 -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(0,0,0,0.9)_0%,transparent_72%)] lg:w-48"
          />
          <img
            src="/img/High_Elf_Archer_Full_Body_II.webp"
            alt=""
            class="pointer-events-none relative w-full [mask-image:linear-gradient(to_bottom,black_92%,transparent_99.5%)] [-webkit-mask-image:linear-gradient(to_bottom,black_92%,transparent_99.5%)]"
          />
        </div>
      </div>
    </section>

    <section id="como-funciona" class="scroll-mt-24 py-16">
      <h2 class="text-center text-2xl font-semibold">As Regras do Jogo</h2>
      <p class="mx-auto mt-2 max-w-xl text-center text-muted-foreground">Três peças simples que se somam numa jornada de verdade.</p>
      <div class="mt-10 grid gap-4 sm:grid-cols-3">
        <div class="glass-panel p-6 transition-colors hover:border-primary/25">
          <Flame :size="24" class="text-muted-foreground" />
          <h3 class="mt-4 font-semibold">Hábitos com peso real</h3>
          <p class="mt-1 text-sm text-muted-foreground">Cada check-in rende XP e ouro; cada hábito perdido tira HP de verdade.</p>
        </div>
        <div class="glass-panel p-6 transition-colors hover:border-primary/25">
          <Sparkles :size="24" class="text-muted-foreground" />
          <h3 class="mt-4 font-semibold">Classes e habilidades</h3>
          <p class="mt-1 text-sm text-muted-foreground">No nível 5 você escolhe uma classe e começa a desbloquear uma árvore própria de habilidades.</p>
        </div>
        <div class="glass-panel p-6 transition-colors hover:border-primary/25">
          <Heart :size="24" class="text-muted-foreground" />
          <h3 class="mt-4 font-semibold">Recaída de verdade</h3>
          <p class="mt-1 text-sm text-muted-foreground">Deixar o HP chegar a zero custa XP de verdade — a consistência importa.</p>
        </div>
      </div>
    </section>

    <section id="classes" class="scroll-mt-24 py-16">
      <h2 class="text-center text-2xl font-semibold">Escolha um caminho</h2>
      <p class="mx-auto mt-2 max-w-xl text-center text-muted-foreground">Cada classe muda como XP, ouro e HP funcionam pra você — não é só estética.</p>

      <div class="mt-10 grid gap-4 sm:grid-cols-3">
        <div
          v-for="c in classCards"
          :key="c.name"
          class="glass-panel flex flex-col p-6 transition-[border-color,transform] duration-100 hover:border-primary/25 active:scale-95"
        >
          <component :is="c.icon" :size="24" :class="c.iconClass" />
          <h3 class="mt-4 font-semibold">{{ c.name }}</h3>
          <div class="mt-1.5 h-0.5 w-8 rounded-full" :class="c.underlineClass" />
          <ul class="mt-3 space-y-1.5 text-sm text-muted-foreground">
            <li v-for="bullet in c.bullets" :key="bullet" class="flex gap-2">
              <span class="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
              {{ bullet }}
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section id="grimorio" class="scroll-mt-24 py-16">
      <div class="glass-panel grid items-center gap-8 border-primary/20 p-8 sm:grid-cols-[auto_1fr] sm:p-10">
        <div class="mx-auto flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary/30">
          <BookOpen :size="26" class="text-primary" />
        </div>
        <div>
          <h2 class="text-xl font-semibold">Grimório: transforme estudo em batalha</h2>
          <p class="mt-2 max-w-2xl text-muted-foreground">
            Cole qualquer conteúdo — anotações, código, resumo — e a IA gera um resumo e um Chefe de Conhecimento com perguntas reais
            sobre o material. Acertar rende XP; errar tira HP. Estudar vira risco de verdade.
          </p>
        </div>
      </div>
    </section>

    <section class="py-16 text-center">
      <h2 class="text-2xl font-semibold">Hora de começar sua jornada</h2>
      <p class="mx-auto mt-2 max-w-md text-muted-foreground">Leva menos de um minuto pra criar sua conta.</p>
      <NuxtLink
        to="/registro"
        class="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90"
      >
        Iniciar Jornada <ArrowRight :size="16" />
      </NuxtLink>
    </section>
  </div>
</template>
