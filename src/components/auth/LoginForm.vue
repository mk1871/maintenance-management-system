<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue-sonner'

import { Form, FormItem, FormControl, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-vue-next'
import { Card } from '@/components/ui/card'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const errors = reactive({
  email: '',
  password: '',
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
      password: password.value,
    })
    if (error) throw error
    await new Promise((resolve) => setTimeout(resolve, 100))
    await authStore.checkAuth()
    if (authStore.isAuthenticated) {
      toast.success(`Bienvenido, ${authStore.fullName ?? 'usuario'}`)
      router.push({ name: 'Home' })
    } else {
      errorMessage.value = authStore.error || 'Error inesperado. Por favor, inténtelo de nuevo.'
      await authStore.clearAuth()
    }
  } catch (err: unknown) {
    const e = err as Error
    errorMessage.value = e.message.includes('Invalid login credentials')
      ? 'Email o contraseña incorrectos'
      : e.message || 'Error al iniciar sesión'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-muted">
    <Card class="w-full max-w-md p-8 space-y-8 bg-background rounded-xl shadow-lg">
      <div class="text-center space-y-2">
        <h2 class="text-3xl font-bold text-foreground">Sistema de Gestión de Mantenimiento</h2>
        <p class="text-sm text-muted-foreground">
          Ingrese sus credenciales para acceder al sistema
        </p>
      </div>

      <Form class="space-y-6" @submit.prevent="handleLogin">
        <FormItem>
          <FormLabel for="email">Email</FormLabel>
          <FormControl>
            <Input
              id="email"
              v-model="email"
              autocomplete="email"
              placeholder="usuario@ejemplo.com"
              type="email"
              @blur="validateField('email')"
            />
          </FormControl>
          <FormMessage v-if="errors.email">{{ errors.email }}</FormMessage>
        </FormItem>

        <FormItem>
          <FormLabel for="password">Contraseña</FormLabel>
          <FormControl>
            <Input
              id="password"
              v-model="password"
              autocomplete="current-password"
              placeholder="••••••••"
              type="password"
              @blur="validateField('password')"
            />
          </FormControl>
          <FormMessage v-if="errors.password">{{ errors.password }}</FormMessage>
        </FormItem>

        <Alert v-if="errorMessage" variant="destructive">
          <AlertCircle class="h-5 w-5 text-destructive" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{{ errorMessage }}</AlertDescription>
        </Alert>

        <Button :loading="isLoading" class="w-full" type="submit"> Iniciar sesión </Button>
      </Form>
    </Card>
  </div>
</template>
