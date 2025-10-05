<template>
  <div class="min-h-screen flex items-center justify-center bg-muted">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-2xl font-bold">Crear Cuenta</CardTitle>
        <CardDescription>Regístrese para acceder al sistema de gestión</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleRegister">
          <div class="space-y-4">
            <!-- Full Name field -->
            <div>
              <Label for="fullName" class="text-right">Nombre Completo</Label>
              <Input
                id="fullName"
                v-model="fullName"
                type="text"
                required
                :class="{ 'border-destructive': errors.fullName }"
                @blur="validateField('fullName')"
                placeholder="Nombre Apellido"
              />
              <p v-if="errors.fullName" class="mt-1 text-sm text-destructive">{{ errors.fullName }}</p>
            </div>

            <!-- Email field -->
            <div>
              <Label for="email" class="text-right">Email</Label>
              <Input
                id="email"
                v-model="email"
                type="email"
                autocomplete="email"
                required
                :class="{ 'border-destructive': errors.email }"
                @blur="validateField('email')"
                placeholder="nombre@ejemplo.com"
              />
              <p v-if="errors.email" class="mt-1 text-sm text-destructive">{{ errors.email }}</p>
            </div>

            <!-- Password field -->
            <div>
              <Label for="password" class="text-right">Contraseña</Label>
              <Input
                id="password"
                v-model="password"
                type="password"
                required
                :class="{ 'border-destructive': errors.password }"
                @blur="validateField('password')"
                placeholder="••••••••"
              />
              <p v-if="errors.password" class="mt-1 text-sm text-destructive">{{ errors.password }}</p>
            </div>

            <!-- Confirm Password field -->
            <div>
              <Label for="confirmPassword" class="text-right">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                v-model="confirmPassword"
                type="password"
                required
                :class="{ 'border-destructive': errors.confirmPassword }"
                @blur="validateField('confirmPassword')"
                placeholder="••••••••"
              />
              <p v-if="errors.confirmPassword" class="mt-1 text-sm text-destructive">{{ errors.confirmPassword }}</p>
            </div>

            <!-- Role selection -->
            <div>
              <Label class="text-right">Rol</Label>
              <Select v-model="role" @update:modelValue="validateField('role')">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Seleccione un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="chief">Jefe</SelectItem>
                </SelectContent>
              </Select>
              <p v-if="errors.role" class="mt-1 text-sm text-destructive">{{ errors.role }}</p>
            </div>
          </div>

          <!-- Error message -->
          <div v-if="errorMessage" class="mt-4 rounded-md bg-destructive/10 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-destructive">
                  {{ errorMessage }}
                </h3>
              </div>
            </div>
          </div>

          <!-- Submit button -->
          <Button 
            type="submit" 
            class="mt-6 w-full" 
            :disabled="isLoading"
            variant="default"
          >
            <span v-if="!isLoading" class="flex items-center">
              Crear Cuenta
            </span>
            <span v-else class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Procesando...
            </span>
          </Button>
        </form>

        <div class="mt-4 text-center text-sm">
          ¿Ya tienes cuenta?
          <RouterLink to="/login" class="font-medium underline underline-offset-4 text-primary">
            Inicia sesión aquí
          </RouterLink>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// State
const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const role = ref<'supervisor' | 'chief' | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')
const errors = reactive({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: ''
})

const router = useRouter()

// Validation
const validateField = (field: string) => {
  switch (field) {
    case 'fullName':
      if (!fullName.value) {
        errors.fullName = 'Nombre completo requerido'
      } else if (fullName.value.trim().split(' ').length < 2) {
        errors.fullName = 'Ingrese nombre y apellido'
      } else {
        errors.fullName = ''
      }
      break
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
    case 'confirmPassword':
      if (!confirmPassword.value) {
        errors.confirmPassword = 'Confirme la contraseña'
      } else if (confirmPassword.value !== password.value) {
        errors.confirmPassword = 'Las contraseñas no coinciden'
      } else {
        errors.confirmPassword = ''
      }
      break
    case 'role':
      if (!role.value) {
        errors.role = 'Seleccione un rol'
      } else {
        errors.role = ''
      }
      break
  }
}

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const handleRegister = async () => {
  // Reset errors
  errorMessage.value = ''
  
  // Validate all fields
  validateField('fullName')
  validateField('email')
  validateField('password')
  validateField('confirmPassword')
  validateField('role')
  
  // Check if there are validation errors
  const hasErrors = Object.values(errors).some(error => error !== '')
  if (hasErrors) {
    return
  }
  
  isLoading.value = true
  
  try {
    // Sign up with Supabase Auth
    const { error: authError, data } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        data: {
          full_name: fullName.value,
          role: role.value
        }
      }
    })
    
    if (authError) {
      throw authError
    }
    
    // Redirect to login with success message
    // The user profile should be created automatically via the trigger in Supabase
    router.push('/login')
  } catch (error: any) {
    console.error('Registration error:', error)
    errorMessage.value = error?.message || 'Error al registrar el usuario'
  } finally {
    isLoading.value = false
  }
}
</script>