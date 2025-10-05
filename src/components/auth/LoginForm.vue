<template>
  <div class="min-h-screen flex items-center justify-center bg-muted">
    <div class="w-full max-w-md p-8 space-y-8 bg-background rounded-xl shadow-lg">
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-bold text-foreground">Sistema de Gestión de Mantenimiento</h2>
        <p class="mt-2 text-sm text-muted-foreground">Ingrese sus credenciales para acceder al sistema</p>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="space-y-4">
          <!-- Email field -->
          <div>
            <label for="email" class="block text-sm font-medium text-foreground">Email</label>
            <div class="mt-1">
              <input
                id="email"
                v-model="email"
                type="email"
                autocomplete="email"
                required
                :class="[
                  'appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm',
                  errors.email ? 'border-destructive' : 'border-input'
                ]"
                @blur="validateField('email')"
              />
              <p v-if="errors.email" class="mt-2 text-sm text-destructive">{{ errors.email }}</p>
            </div>
          </div>

          <!-- Password field -->
          <div>
            <label for="password" class="block text-sm font-medium text-foreground">Contraseña</label>
            <div class="mt-1">
              <input
                id="password"
                v-model="password"
                type="password"
                autocomplete="current-password"
                required
                :class="[
                  'appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm',
                  errors.password ? 'border-destructive' : 'border-input'
                ]"
                @blur="validateField('password')"
              />
              <p v-if="errors.password" class="mt-2 text-sm text-destructive">{{ errors.password }}</p>
            </div>
          </div>
        </div>

        <!-- Error message -->
        <div v-if="errorMessage" class="rounded-md bg-destructive/10 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-destructive">
                {{ errorMessage }}
              </h3>
            </div>
          </div>
        </div>

        <!-- Forgot password link -->
        <div class="text-sm">
          <a href="#" class="font-medium text-primary hover:text-primary/80">
            ¿Olvidó su contraseña?
          </a>
        </div>

        <!-- Submit button -->
        <div>
          <button
            type="submit"
            :disabled="isLoading"
            class="group relative flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
          >
            <span v-if="!isLoading" class="flex items-center">
              Iniciar sesión
            </span>
            <span v-else class="flex items-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Procesando...
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { supabase } from '@/services/supabase'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// State
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const errors = reactive({
  email: '',
  password: ''
})

const router = useRouter()
const authStore = useAuthStore()

// Validation
const validateField = (field: string) => {
  switch (field) {
    case 'email':
      if (!email.value) {
        errors.email = 'Email requerido'
      } else if (!isValidEmail(email.value)) {
        errors.email = 'Formato de email inválido'
      } else {
        errors.email = ''
      }
      break
    case 'password':
      if (!password.value) {
        errors.password = 'Contraseña requerida'
      } else if (password.value.length < 8) {
        errors.password = 'Mínimo 8 caracteres'
      } else {
        errors.password = ''
      }
      break
  }
}

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const handleLogin = async () => {
  // Reset errors
  errorMessage.value = ''
  
  // Validate all fields
  validateField('email')
  validateField('password')
  
  // Check if there are validation errors
  if (errors.email || errors.password) {
    return
  }
  
  isLoading.value = true
  
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })
    
    if (error) {
      throw error
    }
    
    // The auth store will handle updating user state
    // Wait a moment to let the auth store update
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Check if the user profile is loaded
    if (authStore.isAuthenticated) {
      // Redirect to dashboard
      router.push('/')
    } else {
      // If the user exists in Supabase but not in our users table, show error
      errorMessage.value = 'Usuario no encontrado en la base de datos. Contacte al administrador.'
      authStore.clearAuth()
    }
  } catch (error: any) {
    console.error('Login error:', error)
    // Mostrar mensaje más específico según el tipo de error
    if (error?.message?.includes('Invalid login credentials')) {
      errorMessage.value = 'Email o contraseña incorrectos'
    } else {
      errorMessage.value = error?.message || 'Error al iniciar sesión'
    }
  } finally {
    isLoading.value = false
  }
}
</script>