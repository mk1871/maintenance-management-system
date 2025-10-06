<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'vue-sonner'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const errors = reactive({
  email: '',
  password: ''
})

const validateField = (field: string) => {
  switch (field) {
    case 'email':
      if (!email.value) errors.email = 'Email requerido'
      else if (!/^\S+@\S+\.\S+$/.test(email.value)) errors.email = 'Formato de email inválido'
      else errors.email = ''
      break
    case 'password':
      if (!password.value) errors.password = 'Contraseña requerida'
      else if (password.value.length < 8) errors.password = 'Mínimo 8 caracteres'
      else errors.password = ''
      break
  }
}

const handleLogin = async () => {
  errorMessage.value = ''
  validateField('email')
  validateField('password')

  if (errors.email || errors.password) return

  isLoading.value = true

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    if (error) throw error

    await authStore.checkAuth()

    if (authStore.isAuthenticated) {
      toast.success(`Bienvenido, ${authStore.fullName ?? 'usuario'}`)
      router.push({ name: 'Home' })
    } else {
      errorMessage.value = 'No se pudo autenticar el usuario. Intenta de nuevo.'
      authStore.clearAuth()
    }
  } catch (err: unknown) {
    const error = err as Error
    if (error.message.includes('Invalid login credentials')) {
      errorMessage.value = 'Email o contraseña incorrectos.'
    } else {
      errorMessage.value = error.message || 'Error al iniciar sesión'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <form class="max-w-md mx-auto p-6 bg-card rounded-lg shadow-md" @submit.prevent="handleLogin">
    <div class="mb-4">
      <Label class="block mb-1" for="email">Email</Label>
      <Input
        id="email"
        v-model="email"
        :class="{ 'border-destructive': errors.email }"
        placeholder="tucorreo@ejemplo.com"
        required
        type="email"
        @blur="validateField('email')"
      />
      <p v-if="errors.email" class="text-destructive text-sm mt-1">{{ errors.email }}</p>
    </div>
    <div class="mb-4">
      <Label class="block mb-1" for="password">Contraseña</Label>
      <Input
        id="password"
        v-model="password"
        :class="{ 'border-destructive': errors.password }"
        placeholder="********"
        required
        type="password"
        @blur="validateField('password')"
      />
      <p v-if="errors.password" class="text-destructive text-sm mt-1">{{ errors.password }}</p>
    </div>
    <div v-if="errorMessage" class="text-destructive text-sm mb-4">{{ errorMessage }}</div>
    <Button :disabled="isLoading" class="w-full" type="submit">
      <span v-if="isLoading" class="animate-spin mr-2">🔄</span> Iniciar sesión
    </Button>
  </form>
</template>
