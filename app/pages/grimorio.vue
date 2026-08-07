<script setup lang="ts">
import { Check, Flame, Skull, Sparkles, Swords, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { GRIMOIRE_HP_LOSS_PER_WRONG } from '#shared/gamification'
import type { GrimoireAnswerResultDTO, GrimoireSessionDTO } from '#shared/types'

const { data: user, refresh: refreshUser } = useUserState()
const { data: history, refresh: refreshHistory } = useGrimoireHistory()

const content = ref('')
const analyzing = ref(false)
const analyzeError = ref('')

const session = ref<GrimoireSessionDTO | null>(null)
const activeTab = ref<'fogueira' | 'batalha'>('fogueira')

const selectedOption = ref<number | null>(null)
const lastResult = ref<GrimoireAnswerResultDTO | null>(null)
const showFeedback = ref(false)
const answering = ref(false)

const answeredCount = computed(() => session.value?.answers.length ?? 0)
const correctSoFar = computed(() => session.value?.answers.filter((a) => a.correct).length ?? 0)
const battleComplete = computed(() => session.value?.status === 'concluida')
const currentQuestion = computed(() =>
  session.value && !battleComplete.value ? session.value.quiz[answeredCount.value] : null,
)
const monsterHpPercent = computed(() => Math.max(0, 100 - (correctSoFar.value / 3) * 100))

async function analyze() {
  if (content.value.trim().length < 100) {
    analyzeError.value = 'Cole pelo menos 100 caracteres de conteúdo.'
    return
  }
  analyzing.value = true
  analyzeError.value = ''
  try {
    session.value = await createGrimoireSession(content.value)
    selectedOption.value = null
    lastResult.value = null
    showFeedback.value = false
    activeTab.value = 'fogueira'
    content.value = ''
    await refreshHistory()
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
  answering.value = true
  try {
    const result = await answerGrimoireQuestion(session.value.id, qIndex, picked)
    lastResult.value = result
    showFeedback.value = true
    session.value.answers = [...session.value.answers, { questionIndex: qIndex, selectedOption: picked, correct: result.correct }]
    if (result.battleComplete) {
      session.value.status = 'concluida'
      session.value.correctCount = result.correctCount
      session.value.xpAwarded = result.xpAwarded
    }
    await Promise.all([refreshUser(), refreshHistory()])
  } finally {
    answering.value = false
  }
}

function nextQuestion() {
  showFeedback.value = false
  selectedOption.value = null
  lastResult.value = null
}

async function resume(target: GrimoireSessionDTO) {
  session.value = await fetchGrimoireSession(target.id)
  selectedOption.value = null
  lastResult.value = null
  showFeedback.value = false
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
      <div class="flex items-center justify-between gap-3">
        <p class="text-xs text-muted-foreground">{{ content.trim().length }} caracteres (mín. 100)</p>
        <Button class="rounded-full" :disabled="analyzing" @click="analyze">
          <Sparkles :size="16" /> {{ analyzing ? 'Invocando o chefe…' : 'Analisar Conhecimento' }}
        </Button>
      </div>
      <p v-if="analyzeError" class="text-sm text-red-400">{{ analyzeError }}</p>
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
          <p class="mb-1 text-xs text-muted-foreground">Pergunta {{ answeredCount + 1 }} de 3</p>
          <p class="mb-4 font-medium">{{ currentQuestion.question }}</p>

          <div class="grid gap-2">
            <button
              v-for="(option, i) in currentQuestion.options"
              :key="i"
              type="button"
              :disabled="showFeedback || answering"
              class="glass-inset flex items-center gap-3 rounded-2xl border p-3 text-left text-sm transition-colors disabled:cursor-default"
              :class="[
                selectedOption === i && !showFeedback ? 'border-primary' : 'border-white/5',
                showFeedback && lastResult && i === lastResult.correctIndex ? 'border-emerald-500 bg-emerald-500/10' : '',
                showFeedback && lastResult && i === selectedOption && !lastResult.correct ? 'border-red-500 bg-red-500/10' : '',
              ]"
              @click="!showFeedback && (selectedOption = i)"
            >
              <span
                class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs"
                :class="selectedOption === i ? 'border-primary bg-primary/20' : 'border-white/20'"
              >
                <Check v-if="showFeedback && lastResult && i === lastResult.correctIndex" :size="12" class="text-emerald-400" />
                <X v-else-if="showFeedback && i === selectedOption && lastResult && !lastResult.correct" :size="12" class="text-red-400" />
              </span>
              {{ option }}
            </button>
          </div>

          <div v-if="showFeedback && lastResult" class="mt-4 space-y-3">
            <p class="text-sm" :class="lastResult.correct ? 'text-emerald-400' : 'text-red-400'">
              {{ lastResult.correct ? 'Acertou! Dano no chefe.' : `Errou. Você perdeu ${GRIMOIRE_HP_LOSS_PER_WRONG} HP.` }}
            </p>
            <p class="text-sm text-muted-foreground">{{ lastResult.explanation }}</p>
            <p v-if="lastResult.relapsed" class="flex items-center gap-2 text-sm font-semibold text-red-500">
              <Skull :size="14" /> Seu HP chegou a 0 — você recaiu (veja o Dashboard).
            </p>
            <Button class="rounded-full" @click="nextQuestion">Continuar</Button>
          </div>
          <Button v-else class="mt-4 rounded-full" :disabled="selectedOption === null || answering" @click="submitAnswer">
            {{ answering ? 'Atacando…' : 'Responder' }}
          </Button>
        </div>

        <div v-else class="text-center">
          <Sparkles :size="32" class="mx-auto mb-2 text-amber-300" />
          <p class="text-lg font-semibold">
            Chefe derrotado! {{ session.correctCount }}/3 acertos
          </p>
          <p class="text-muted-foreground">+{{ session.xpAwarded }} XP em Inteligência</p>
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
        <span v-if="item.status === 'concluida'" class="shrink-0 text-emerald-400">{{ item.correctCount }}/3 · +{{ item.xpAwarded }} XP</span>
        <span v-else class="shrink-0 text-amber-400">Batalha pendente</span>
      </button>
    </div>
  </div>
</template>
