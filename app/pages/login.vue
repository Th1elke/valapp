<script setup lang="ts">
import { ArrowRight, Lock, Mail } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

definePageMeta({ layout: 'auth' })

const { fetch: refreshSession } = useUserSession()

const email = ref('')
const password = ref('')
const submitting = ref(false)
const error = ref('')

async function submit() {
  submitting.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { email: email.value, password: password.value } })
    await refreshSession()
    await navigateTo('/')
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Não foi possível entrar.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthCard title="Entrar" subtitle="Continue de onde parou.">
    <form class="space-y-4" @submit.prevent="submit">
      <AuthField v-model="email" label="E-mail" :icon="Mail" type="email" autocomplete="email" placeholder="seu@email.com" required />
      <AuthField v-model="password" label="Senha" :icon="Lock" type="password" autocomplete="current-password" placeholder="••••••••" required />
      <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
      <Button type="submit" class="flex w-full items-center justify-center gap-2 rounded-full" :disabled="submitting">
        {{ submitting ? 'Entrando…' : 'Entrar' }} <ArrowRight :size="16" />
      </Button>
    </form>

    <template #footer> Não tem conta? <NuxtLink to="/registro" class="text-primary hover:underline">Criar conta</NuxtLink> </template>
  </AuthCard>
</template>
