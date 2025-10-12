<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { LogIn, Mail, Lock } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'

import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth'

// Router y store
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Form data
interface LoginFormData {
  email: string
  password: string
}
const formData = ref<LoginFormData>({ email: '', password: '' })

// Validation errors
interface FormErrors {
  email: string
  password: string
}
const errors = reactive<FormErrors>({ email: '', password: '' })

// UI state
const isLoading = ref(false)
const hasAttemptedSubmit = ref(false)

const MIN_PASSWORD_LENGTH = 6
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isFormValid = computed(
  () =>
    !errors.email &&
    !errors.password &&
    formData.value.email.length > 0 &&
    formData.value.password.length >= MIN_PASSWORD_LENGTH,
)

const validateEmail = () => {
  const email = formData.value.email.trim()
  if (!email) {
    errors.email = 'El email es requerido'
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Formato de email inválido'
  } else {
    errors.email = ''
  }
}

const validatePassword = () => {
  const pwd = formData.value.password
  if (!pwd) {
    errors.password = 'La contraseña es requerida'
  } else if (pwd.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Mínimo ${MIN_PASSWORD_LENGTH} caracteres`
  } else {
    errors.password = ''
  }
}

const getRedirectPath = (): string => {
  const redirect = route.query.redirect as string
  return redirect || '/'
}

const handleLogin = async (): Promise<void> => {
  hasAttemptedSubmit.value = true
  validateEmail()
  validatePassword()

  if (!isFormValid.value) {
    toast.error('Por favor, corrige los errores del formulario')
    return
  }

  isLoading.value = true
  authStore.setError(null)

  try {
    const result = await supabase.auth.signInWithPassword({
      email: formData.value.email.trim(),
      password: formData.value.password,
    })
    const error = result.error

    if (error) {
      errors.email = ' '
      errors.password = 'Email o contraseña incorrectos'
      toast.error('Credenciales incorrectas')
      return
    }

    await authStore.checkAuth()
    if (authStore.isAuthenticated) {
      toast.success(`Bienvenido, ${authStore.fullName}`)
      router.replace(getRedirectPath())
    }
  } catch (err: unknown) {
    console.error('Error en login:', err)
    toast.error('Error al iniciar sesión. Intenta nuevamente.')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  authStore.setError(null)
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-muted/30 p-4">
    <Card class="w-full max-w-md">
      <CardHeader class="space-y-1 text-center">
        <div class="flex justify-center mb-4">
          <div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <LogIn class="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle class="text-2xl font-bold">Iniciar Sesión</CardTitle>
        <CardDescription>Ingresa tus credenciales para acceder al sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit.prevent="handleLogin">
          <div class="space-y-2">
            <Label for="email">Email *</Label>
            <div class="relative">
              <Mail class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                v-model="formData.email"
                :class="{ 'border-destructive': errors.email && hasAttemptedSubmit }"
                autocomplete="email"
                class="pl-9"
                placeholder="tu@mail.com"
                type="email"
                @blur="validateEmail"
                @input="hasAttemptedSubmit && validateEmail()"
              />
            </div>
            <p
              v-if="errors.email && hasAttemptedSubmit"
              class="text-sm font-medium text-destructive"
            >
              {{ errors.email }}
            </p>
          </div>
          <div class="space-y-2">
            <Label for="password">Contraseña *</Label>
            <div class="relative">
              <Lock class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                v-model="formData.password"
                :class="{ 'border-destructive': errors.password && hasAttemptedSubmit }"
                autocomplete="current-password"
                class="pl-9"
                placeholder="••••••••"
                type="password"
                @blur="validatePassword"
                @input="hasAttemptedSubmit && validatePassword()"
              />
            </div>
            <p
              v-if="errors.password && hasAttemptedSubmit"
              class="text-sm font-medium text-destructive"
            >
              {{ errors.password }}
            </p>
          </div>
          <Button :disabled="isLoading" class="w-full" size="lg" type="submit">
            <Spinner v-if="isLoading" class="h-4 w-4 mr-2" />
            <LogIn v-else class="h-4 w-4 mr-2" />
            {{ isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
          </Button>
        </form>
        <div class="mt-6 text-center text-sm text-muted-foreground">
          <p>Sistema de Gestión de Mantenimiento</p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
