<script setup lang="ts">
import { Check, Eye, Flame, Gem, Skull, Sparkles, Swords, VenetianMask, X, Zap } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { GRIMOIRE_MIN_LENGTH } from '#shared/gamification'
import type { GrimoireAnswerResultDTO, GrimoireSessionDTO } from '#shared/types'

const { data: user, refresh: refreshUser } = useUserState()
const { data: history, refresh: refreshHistory } = useGrimoireHistory()
const toast = useAppToast()

const content = ref('')
const useElixirChecked = ref(false)
const apostaAltaChecked = ref(false)
const hasApostaAlta = computed(() => user.value?.unlockedSkills.includes('ladino_aposta_alta') ?? false)
const analyzing = ref(false)
const analyzeError = ref('')

const session = ref<GrimoireSessionDTO | null>(null)
const activeTab = ref<'fogueira' | 'batalha'>('fogueira')

const selectedOption = ref<number | null>(null)
const lastResult = ref<GrimoireAnswerResultDTO | null>(null)
const showFeedback = ref(false)
const answering = ref(false)
const eliminatedIndices = ref<number[]>([])
const revealingHint = ref(false)
const hpLossLastAnswer = ref(0)

const answeredCount = computed(() => session.value?.answers.length ?? 0)
const correctSoFar = computed(() => session.value?.answers.filter((a) => a.correct).length ?? 0)
const battleComplete = computed(() => session.value?.status === 'concluida')
const currentQuestionIndex = computed(() => {
  if (!showFeedback.value) return answeredCount.value
  if (lastResult.value?.shieldUsed || lastResult.value?.dodged) return answeredCount.value
  return answeredCount.value - 1
})
const currentQuestion = computed(() => session.value?.quiz[currentQuestionIndex.value] ?? null)
const monsterHpPercent = computed(() => Math.max(0, 100 - (correctSoFar.value / 3) * 100))

const olhoCount = computed(() => user.value?.inventory.olho_visao ?? 0)
const escudoCount = computed(() => user.value?.inventory.escudo_cristal ?? 0)
const elixirCount = computed(() => user.value?.inventory.elixir_erudito ?? 0)
const penaCount = computed(() => user.value?.inventory.pena_magica ?? 0)

async function analyze() {
  if (content.value.trim().length < GRIMOIRE_MIN_LENGTH) {
    analyzeError.value = `Cole pelo menos ${GRIMOIRE_MIN_LENGTH} caracteres de conteúdo.`
    return
  }
  analyzing.value = true
  analyzeError.value = ''
  try {
    session.value = await createGrimoireSession(content.value, useElixirChecked.value, apostaAltaChecked.value)
    selectedOption.value = null
    lastResult.value = null
    showFeedback.value = false
    eliminatedIndices.value = []
    activeTab.value = 'fogueira'
    content.value = ''
    useElixirChecked.value = false
    apostaAltaChecked.value = false
    await Promise.all([refreshHistory(), refreshUser()])
  } catch (err) {
    analyzeError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Não foi possível gerar o quiz.'
  } finally {
    analyzing.value = false
  }
}

async function submitAnswer() {
  if (selectedOption.value === null || !session.value || battleComplete.value) return
  const qIndex = answeredCount.value
  const picked = selectedOption.value
  const hpBefore = user.value?.hp ?? 0
  answering.value = true
  try {
    const result = await answerGrimoireQuestion(session.value.id, qIndex, picked)
    lastResult.value = result
    hpLossLastAnswer.value = Math.max(0, hpBefore - result.hp)
    showFeedback.value = true
    if (!result.shieldUsed && !result.dodged) {
      session.value.answers = [...session.value.answers, { questionIndex: qIndex, selectedOption: picked, correct: result.correct }]
      // Não marca a sessão como concluída ainda, mesmo se essa foi a 3ª pergunta — isso esconderia
      // o feedback de acerto/erro dela (battleComplete vira o gate de qual tela mostrar). Só aplica
      // em nextQuestion(), depois que o usuário já viu o feedback e clicou em "Continuar".
    }
    await Promise.all([refreshUser(), refreshHistory()])
  } finally {
    answering.value = false
  }
}

async function useHint() {
  if (!session.value || olhoCount.value <= 0 || showFeedback.value) return
  revealingHint.value = true
  try {
    const result = await revealGrimoireHint(session.value.id, currentQuestionIndex.value)
    eliminatedIndices.value = result.eliminatedIndices
    await refreshUser()
  } finally {
    revealingHint.value = false
  }
}

function nextQuestion() {
  const keepsHints = lastResult.value?.shieldUsed || lastResult.value?.dodged
  if (lastResult.value?.battleComplete && session.value) {
    session.value.status = 'concluida'
    session.value.correctCount = lastResult.value.correctCount
    session.value.xpAwarded = lastResult.value.xpAwarded
    toast.success(
      lastResult.value.correctCount === 3
        ? `Chefe derrotado! +${lastResult.value.xpAwarded} XP em Inteligência`
        : `O chefe resistiu — ${lastResult.value.correctCount}/3 acertos`,
    )
  }
  showFeedback.value = false
  selectedOption.value = null
  lastResult.value = null
  if (!keepsHints) eliminatedIndices.value = []
}

async function resume(target: GrimoireSessionDTO) {
  session.value = await fetchGrimoireSession(target.id)
  selectedOption.value = null
  lastResult.value = null
  showFeedback.value = false
  eliminatedIndices.value = []
  activeTab.value = session.value.status === 'concluida' ? 'fogueira' : 'batalha'
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">Grimório</h1>
      <p class="text-muted-foreground">Cole sua matéria de estudo e enfrente um chefe de conhecimento</p>
    </div>

    <div class="glass-panel space-y-3 p-5">
      <textarea
        v-model="content"
        rows="6"
        placeholder="Cole aqui suas anotações, trechos de código ou resumos de estudo…"
        class="w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <label v-if="elixirCount > 0" class="flex items-center gap-2 text-sm text-muted-foreground">
        <input v-model="useElixirChecked" type="checkbox" class="rounded border-white/20" />
        <Zap :size="14" class="text-amber-400" />
        Usar Elixir do Erudito nesta batalha (dobra o XP do chefe) — você tem {{ elixirCount }}
      </label>
      <label v-if="hasApostaAlta" class="flex items-center gap-2 text-sm text-muted-foreground">
        <input v-model="apostaAltaChecked" type="checkbox" class="rounded border-white/20" />
        <VenetianMask :size="14" class="text-violet-400" />
        Aposta Alta nesta batalha: dobra a perda de HP por erro, mas também dobra XP e ouro na vitória
      </label>
      <p v-if="penaCount > 0" class="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles :size="12" class="text-fuchsia-400" />
        Você tem Pena Mágica de Expansão: textos além do limite normal ainda podem gerar um Super Chefe.
      </p>
      <div class="flex items-center justify-between gap-3">
        <p class="text-xs text-muted-foreground">{{ content.trim().length }} caracteres (mín. {{ GRIMOIRE_MIN_LENGTH }})</p>
        <Button class="rounded-full" :disabled="analyzing" @click="analyze">
          <Sparkles :size="16" /> {{ analyzing ? 'Invocando o chefe…' : 'Analisar Conhecimento' }}
        </Button>
      </div>
      <p v-if="analyzeError" class="text-sm text-destructive">{{ analyzeError }}</p>
    </div>

    <div v-if="session" class="space-y-4">
      <div class="flex gap-2">
        <button
          type="button"
          class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
          :class="activeTab === 'fogueira' ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'"
          @click="activeTab = 'fogueira'"
        >
          Fogueira
        </button>
        <button
          type="button"
          class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
          :class="activeTab === 'batalha' ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'"
          @click="activeTab = 'batalha'"
        >
          Batalha
        </button>
      </div>

      <div v-if="activeTab === 'fogueira'" class="glass-panel p-6">
        <h2 class="mb-3 flex items-center gap-2 font-semibold">
          <Flame :size="18" class="text-orange-400" /> Resumo
        </h2>
        <p class="whitespace-pre-line leading-relaxed text-muted-foreground">{{ session.summary }}</p>
        <Button v-if="!battleComplete" class="mt-5 rounded-full" @click="activeTab = 'batalha'">
          <Swords :size="16" /> Ir para a Batalha
        </Button>
      </div>

      <div v-else class="glass-panel space-y-5 p-6">
        <div class="flex items-center gap-4">
          <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-700">
            <Skull :size="26" class="text-white" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm text-muted-foreground">Chefe de Conhecimento</p>
            <Progress :model-value="monsterHpPercent" :max="100" bar-class="from-red-500 to-rose-600" />
          </div>
          <div class="text-right text-sm">
            <p class="text-muted-foreground">Sua vida</p>
            <p class="font-semibold">{{ user?.hp }} HP</p>
          </div>
        </div>

        <div v-if="!battleComplete && currentQuestion">
          <div class="mb-1 flex items-center justify-between gap-2">
            <p class="text-xs text-muted-foreground">Pergunta {{ currentQuestionIndex + 1 }} de 3</p>
            <div class="flex items-center gap-2">
              <span v-if="escudoCount > 0" class="flex items-center gap-1 text-xs text-sky-300" title="Absorve o próximo erro automaticamente">
                <Gem :size="12" /> {{ escudoCount }}
              </span>
              <button
                v-if="olhoCount > 0"
                type="button"
                :disabled="showFeedback || revealingHint || eliminatedIndices.length > 0"
                class="flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-xs text-amber-300 transition-colors hover:bg-white/5 disabled:cursor-default disabled:opacity-50"
                @click="useHint"
              >
                <Eye :size="12" /> {{ revealingHint ? 'Revelando…' : `Olho (${olhoCount})` }}
              </button>
            </div>
          </div>
          <p class="mb-4 font-medium">{{ currentQuestion.question }}</p>

          <div class="grid gap-2">
            <button
              v-for="(option, i) in currentQuestion.options"
              :key="i"
              type="button"
              :disabled="showFeedback || answering || eliminatedIndices.includes(i)"
              class="glass-inset flex items-center gap-3 rounded-2xl border p-3 text-left text-sm transition-colors disabled:cursor-default"
              :class="[
                selectedOption === i && !showFeedback ? 'border-primary' : 'border-white/5',
                eliminatedIndices.includes(i) ? 'opacity-30' : '',
                showFeedback && lastResult && i === lastResult.correctIndex ? 'border-success bg-success/10' : '',
                showFeedback && lastResult && i === selectedOption && !lastResult.correct ? 'border-destructive bg-destructive/10' : '',
              ]"
              @click="!showFeedback && !eliminatedIndices.includes(i) && (selectedOption = i)"
            >
              <span
                class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs"
                :class="selectedOption === i ? 'border-primary bg-primary/20' : 'border-white/20'"
              >
                <Check v-if="showFeedback && lastResult && i === lastResult.correctIndex" :size="12" class="text-success" />
                <X v-else-if="showFeedback && i === selectedOption && lastResult && !lastResult.correct" :size="12" class="text-destructive" />
              </span>
              {{ option }}
            </button>
          </div>

          <div v-if="showFeedback && lastResult" class="mt-4 space-y-3">
            <p v-if="lastResult.shieldUsed" class="flex items-center gap-2 text-sm font-semibold text-sky-300">
              <Gem :size="14" /> Seu Escudo de Cristal absorveu o golpe! Tente novamente, sem perder HP.
            </p>
            <p v-else-if="lastResult.dodged" class="flex items-center gap-2 text-sm font-semibold text-violet-300">
              <VenetianMask :size="14" /> Você fintou o destino! O erro não contou. Tente novamente.
            </p>
            <template v-else>
              <p class="text-sm" :class="lastResult.correct ? 'text-success' : 'text-destructive'">
                {{ lastResult.correct ? 'Acertou! Dano no chefe.' : `Errou. Você perdeu ${hpLossLastAnswer} HP.` }}
              </p>
              <p v-if="lastResult.explanation" class="text-sm text-muted-foreground">{{ lastResult.explanation }}</p>
              <p v-if="lastResult.relapsed" class="flex items-center gap-2 text-sm font-semibold text-destructive">
                <Skull :size="14" /> Seu HP chegou a 0 — você recaiu (veja o Dashboard).
              </p>
            </template>
            <Button class="rounded-full" @click="nextQuestion">
              {{ lastResult.shieldUsed || lastResult.dodged ? 'Tentar novamente' : 'Continuar' }}
            </Button>
          </div>
          <Button v-else class="mt-4 rounded-full" :disabled="selectedOption === null || answering" @click="submitAnswer">
            {{ answering ? 'Atacando…' : 'Responder' }}
          </Button>
        </div>

        <div v-else class="text-center">
          <template v-if="session.correctCount === 3">
            <Sparkles :size="32" class="mx-auto mb-2 text-amber-300" />
            <p class="text-lg font-semibold">Chefe derrotado! {{ session.correctCount }}/3 acertos</p>
          </template>
          <template v-else>
            <Skull :size="32" class="mx-auto mb-2 text-muted-foreground" />
            <p class="text-lg font-semibold">O chefe resistiu — {{ session.correctCount }}/3 acertos</p>
          </template>
          <p class="text-muted-foreground">
            +{{ session.xpAwarded }} XP em Inteligência
            <span v-if="session.xpBoosted" class="text-amber-400">(dobrado pelo Elixir do Erudito)</span>
          </p>
        </div>
      </div>
    </div>

    <div v-if="history?.length" class="glass-panel divide-y divide-white/5 p-2">
      <h2 class="p-3 text-sm font-semibold text-muted-foreground">Histórico</h2>
      <button
        v-for="item in history"
        :key="item.id"
        type="button"
        class="flex w-full items-center justify-between gap-3 rounded-2xl p-4 text-left text-sm transition-colors hover:bg-white/[0.03]"
        @click="resume(item)"
      >
        <span class="min-w-0 flex-1 truncate text-muted-foreground">{{ item.summary }}</span>
        <span v-if="item.status === 'concluida'" class="shrink-0 text-success">{{ item.correctCount }}/3 · +{{ item.xpAwarded }} XP</span>
        <span v-else class="shrink-0 text-amber-400">Batalha pendente</span>
      </button>
    </div>
  </div>
</template>
