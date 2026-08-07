import { GoogleGenAI } from '@google/genai'
import type { GrimoireQuizQuestion } from '~~/db/schema'
import { GRIMOIRE_QUIZ_LENGTH } from '#shared/gamification'

const MODEL = 'gemini-3.5-flash'

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    quiz: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          correctIndex: { type: 'integer' },
          explanation: { type: 'string' },
        },
        required: ['question', 'options', 'correctIndex', 'explanation'],
      },
    },
  },
  required: ['summary', 'quiz'],
}

const MASTER_PROMPT = `Você é um assistente educacional dentro de um app de hábitos gamificado estilo RPG.
Você receberá um trecho de conteúdo de estudo (anotações, código ou resumo) colado pelo usuário.

Gere, em português do Brasil:
1. Um resumo conciso (3 a 5 frases) do conteúdo, para revisão passiva.
2. Exatamente ${GRIMOIRE_QUIZ_LENGTH} perguntas de múltipla escolha testando a compreensão do conteúdo, cada uma com exatamente 4 alternativas, o índice (0-based) da alternativa correta, e uma breve explicação da resposta correta.

As perguntas devem cobrir o conteúdo fornecido, não conhecimento genérico do assunto. Não invente informação que não esteja no texto.`

interface GeneratedQuiz {
  summary: string
  quiz: GrimoireQuizQuestion[]
}

function assertValidQuiz(data: unknown): asserts data is GeneratedQuiz {
  if (typeof data !== 'object' || data === null) throw new Error('resposta não é um objeto')
  const d = data as Record<string, unknown>

  if (typeof d.summary !== 'string' || !d.summary.trim()) throw new Error('resumo ausente ou inválido')

  if (!Array.isArray(d.quiz) || d.quiz.length !== GRIMOIRE_QUIZ_LENGTH) {
    throw new Error(`esperava exatamente ${GRIMOIRE_QUIZ_LENGTH} perguntas`)
  }

  d.quiz.forEach((q, i) => {
    if (typeof q !== 'object' || q === null) throw new Error(`pergunta ${i} inválida`)
    const question = q as Record<string, unknown>
    if (typeof question.question !== 'string' || !question.question.trim()) throw new Error(`pergunta ${i} sem enunciado`)
    if (
      !Array.isArray(question.options) ||
      question.options.length !== 4 ||
      question.options.some((o) => typeof o !== 'string' || !o.trim())
    ) {
      throw new Error(`pergunta ${i} sem 4 alternativas válidas`)
    }
    if (typeof question.correctIndex !== 'number' || !Number.isInteger(question.correctIndex) || question.correctIndex < 0 || question.correctIndex > 3) {
      throw new Error(`pergunta ${i} com índice de resposta correta inválido`)
    }
    if (typeof question.explanation !== 'string' || !question.explanation.trim()) throw new Error(`pergunta ${i} sem explicação`)
  })
}

export async function generateGrimoireQuiz(content: string): Promise<GeneratedQuiz> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'GEMINI_API_KEY não configurada. Pegue uma chave gratuita em aistudio.google.com/apikey e adicione ao .env.',
    })
  }

  const ai = new GoogleGenAI({ apiKey })

  let response
  try {
    response = await ai.models.generateContent({
      model: MODEL,
      contents: `${MASTER_PROMPT}\n\n--- CONTEÚDO DO USUÁRIO ---\n${content}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    })
  } catch (err) {
    throw createError({ statusCode: 502, statusMessage: `Falha ao consultar a IA: ${(err as Error).message}` })
  }

  const raw = response.text
  if (!raw) throw createError({ statusCode: 502, statusMessage: 'A IA não retornou conteúdo.' })

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'A IA retornou um JSON inválido.' })
  }

  try {
    assertValidQuiz(parsed)
  } catch (err) {
    throw createError({ statusCode: 502, statusMessage: `Resposta da IA em formato inesperado (${(err as Error).message}).` })
  }

  return parsed
}
