<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue-sonner'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

// No auto-redirect on mount; always show login form
onMounted(() => {
  // Clear any previous auth state
  authStore.clearError()
})

async function handleLogin(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })
    if (error) {
      errorMessage.value = 'Credenciales inválidas'
      return
    }
    await authStore.checkAuth()
    if (authStore.isAuthenticated) {
      toast.success(`Bienvenido, ${authStore.fullName}`)
      // Redirect to original target or home
      const target = (route.query.redirect as string) || '/'
      router.replace(target)
    } else {
      errorMessage.value = 'Credenciales inválidas'
    }
  } catch {
    errorMessage.value = 'Credenciales inválidas'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-muted">
    <div class="w-full max-w-md p-8 space-y-8 bg-background rounded-xl shadow-lg">
      <h2 class="text-3xl font-bold text-center">Iniciar Sesión</h2>
      <form class="space-y-4" @submit.prevent="handleLogin">
        <input
          v-model="email"
          class="w-full px-3 py-2 border rounded"
          placeholder="Email"
          required
          type="email"
        />
        <input
          v-model="password"
          class="w-full px-3 py-2 border rounded"
          placeholder="Contraseña"
          required
          type="password"
        />
        <p v-if="errorMessage" class="text-destructive text-center">{{ errorMessage }}</p>
        <Button :disabled="isLoading" class="w-full" type="submit">
          <span v-if="!isLoading">Iniciar sesión</span>
          <Spinner v-else class="h-5 w-5" />
        </Button>
      </form>
    </div>
  </div>
</template>
