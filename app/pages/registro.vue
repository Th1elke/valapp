<script setup lang="ts">
import { ArrowRight, Lock, Mail, User } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { containsEmoji, MAX_NAME_LENGTH, MAX_PASSWORD_LENGTH } from '#shared/validation'

definePageMeta({ layout: 'auth' })

const { fetch: refreshSession } = useUserSession()
const { refresh: refreshUser } = useUserState()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const submitting = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  if (password.value !== confirmPassword.value) {
    error.value = 'As senhas não coincidem.'
    return
  }
  if (containsEmoji(name.value)) {
    error.value = 'O nome não pode conter emojis.'
    return
  }
  if (containsEmoji(password.value)) {
    error.value = 'A senha não pode conter emojis.'
    return
  }

  submitting.value = true
  try {
    await $fetch('/api/auth/register', { method: 'POST', body: { name: name.value, email: email.value, password: password.value } })
    await refreshSession()
    await refreshUser()
    await navigateTo('/')
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Não foi possível criar a conta.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthCard title="Criar conta" subtitle="Sua rotina vira XP a partir de agora.">
    <form class="space-y-4" @submit.prevent="submit">
      <AuthField
        v-model="name"
        label="Nome"
        :icon="User"
        autocomplete="name"
        placeholder="Como te chamamos"
        required
        :maxlength="MAX_NAME_LENGTH"
      />
      <AuthField v-model="email" label="E-mail" :icon="Mail" type="email" autocomplete="email" placeholder="seu@email.com" required />
      <AuthField
        v-model="password"
        label="Senha"
        :icon="Lock"
        type="password"
        autocomplete="new-password"
        placeholder="Mín. 8 caracteres"
        required
        minlength="8"
        :maxlength="MAX_PASSWORD_LENGTH"
      />
      <AuthField
        v-model="confirmPassword"
        label="Confirmar senha"
        :icon="Lock"
        type="password"
        autocomplete="new-password"
        placeholder="Repita a senha"
        required
        minlength="8"
        :maxlength="MAX_PASSWORD_LENGTH"
      />
      <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
      <Button type="submit" class="flex w-full items-center justify-center gap-2 rounded-full" :disabled="submitting">
        {{ submitting ? 'Criando…' : 'Criar conta' }} <ArrowRight :size="16" />
      </Button>
    </form>

    <template #footer> Já tem conta? <NuxtLink to="/login" class="text-primary hover:underline">Entrar</NuxtLink> </template>
  </AuthCard>
</template>
