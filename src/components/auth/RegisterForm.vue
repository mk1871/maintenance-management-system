<script lang="ts" setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { UserPlus, Mail, Lock, User, Shield } from 'lucide-vue-next'

// Componentes UI
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'

// Servicios y stores
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// Interfaces
interface RegisterFormData {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  role: 'supervisor' | 'chief'
}

interface FormErrors {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  role: string
}

// Constantes de validación
const MIN_PASSWORD_LENGTH = 8
const MIN_NAME_PARTS = 2
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/
const PASSWORD_PATTERN = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
const PROFILE_CREATION_DELAY = 1000

// Estado
const formData = ref<RegisterFormData>({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'supervisor',
})

const errors = reactive<FormErrors>({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: '',
})

const isLoading = ref(false)
const hasAttemptedSubmit = ref(false)

/**
 * Verifica si el formulario es válido para envío
 */
const isFormValid = computed(() => {
  return (
    !errors.fullName &&
    !errors.email &&
    !errors.password &&
    !errors.confirmPassword &&
    !errors.role &&
    formData.value.fullName.trim().length > 0 &&
    formData.value.email.length > 0 &&
    formData.value.password.length >= MIN_PASSWORD_LENGTH &&
    formData.value.confirmPassword === formData.value.password
  )
})

/**
 * Valida el nombre completo del usuario
 */
const validateFullName = (): void => {
  const name = formData.value.fullName.trim()

  if (!name) {
    errors.fullName = 'El nombre completo es requerido'
    return
  }

  const nameParts = name.split(' ').filter((part) => part.length > 0)
  if (nameParts.length < MIN_NAME_PARTS) {
    errors.fullName = 'Ingrese nombre y apellido'
    return
  }

  errors.fullName = ''
}

/**
 * Valida el formato del email
 */
const validateEmail = (): void => {
  const email = formData.value.email.trim()

  if (!email) {
    errors.email = 'El email es requerido'
    return
  }

  if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Formato de email inválido'
    return
  }

  errors.email = ''
}

/**
 * Valida la contraseña según requisitos de seguridad
 */
const validatePassword = (): void => {
  const password = formData.value.password

  if (!password) {
    errors.password = 'La contraseña es requerida'
    return
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Mínimo ${MIN_PASSWORD_LENGTH} caracteres`
    return
  }

  if (!PASSWORD_PATTERN.test(password)) {
    errors.password = 'Debe incluir mayúscula, minúscula y número'
    return
  }

  errors.password = ''
}

/**
 * Valida que las contraseñas coincidan
 */
const validateConfirmPassword = (): void => {
  const confirmPassword = formData.value.confirmPassword

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirme la contraseña'
    return
  }

  if (confirmPassword !== formData.value.password) {
    errors.confirmPassword = 'Las contraseñas no coinciden'
    return
  }

  errors.confirmPassword = ''
}

/**
 * Valida que se haya seleccionado un rol
 */
const validateRole = (): void => {
  if (!formData.value.role) {
    errors.role = 'Seleccione un rol'
    return
  }

  errors.role = ''
}

/**
 * Valida todos los campos del formulario
 */
const validateAllFields = (): boolean => {
  validateFullName()
  validateEmail()
  validatePassword()
  validateConfirmPassword()
  validateRole()

  return isFormValid.value
}

/**
 * Obtiene mensaje de error amigable según el error de Supabase
 */
const getErrorMessage = (error: Error): string => {
  const message = error.message

  if (message.includes('User already registered')) {
    return 'El usuario ya está registrado. Intenta iniciar sesión.'
  }

  if (message.includes('Password should be at least')) {
    return 'La contraseña debe cumplir los requisitos de seguridad.'
  }

  if (message.includes('Invalid email')) {
    return 'Formato de email inválido.'
  }

  return message || 'Error al registrar usuario'
}

/**
 * Maneja el proceso de registro de usuario
 */
const handleRegister = async (): Promise<void> => {
  hasAttemptedSubmit.value = true

  if (!validateAllFields()) {
    toast.error('Por favor, corrige los errores del formulario')
    return
  }

  isLoading.value = true

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.value.email.trim(),
      password: formData.value.password,
      options: {
        data: {
          full_name: formData.value.fullName.trim(),
          role: formData.value.role,
        },
      },
    })

    if (authError) throw authError

    if (!authData.user) {
      throw new Error('No se pudo crear el usuario')
    }

    await new Promise((resolve) => setTimeout(resolve, PROFILE_CREATION_DELAY))

    await authStore.checkAuth()

    if (authStore.isAuthenticated) {
      toast.success(`¡Registro exitoso! Bienvenido, ${formData.value.fullName}`)
      router.push({ name: 'Home' })
    } else {
      toast.success('Registro completado. Por favor, inicia sesión.')
      router.push({ name: 'Login' })
    }
  } catch (error: unknown) {
    console.error('Error en registro:', error)
    const errorMessage = getErrorMessage(error as Error)
    toast.error(errorMessage)
  } finally {
    isLoading.value = false
  }
}

/**
 * Obtiene la etiqueta traducida del rol
 */
const getRoleLabel = (roleValue: string): string => {
  const labels: Record<string, string> = {
    supervisor: 'Supervisor',
    chief: 'Jefe',
  }
  return labels[roleValue] ?? roleValue
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-muted/30 p-4">
    <Card class="w-full max-w-md">
      <CardHeader class="space-y-1 text-center">
        <div class="flex justify-center mb-4">
          <div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <UserPlus class="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle class="text-2xl font-bold">Crear Cuenta</CardTitle>
        <CardDescription>
          Ingresa tus datos para registrarte en el sistema
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form class="space-y-4" @submit.prevent="handleRegister">
          <!-- Nombre completo -->
          <div class="space-y-2">
            <Label for="fullName">
              Nombre Completo *
            </Label>
            <div class="relative">
              <User class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                v-model="formData.fullName"
                :class="{ 'border-destructive': errors.fullName && hasAttemptedSubmit }"
                autocomplete="name"
                class="pl-9"
                placeholder="Juan Pérez González"
                type="text"
                @blur="validateFullName"
                @input="hasAttemptedSubmit && validateFullName()"
              />
            </div>
            <p
              v-if="errors.fullName && hasAttemptedSubmit"
              class="text-sm font-medium text-destructive"
            >
              {{ errors.fullName }}
            </p>
          </div>

          <!-- Email -->
          <div class="space-y-2">
            <Label for="email">
              Email *
            </Label>
            <div class="relative">
              <Mail class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                v-model="formData.email"
                :class="{ 'border-destructive': errors.email && hasAttemptedSubmit }"
                autocomplete="email"
                class="pl-9"
                placeholder="juan@ejemplo.com"
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

          <!-- Contraseña -->
          <div class="space-y-2">
            <Label for="password">
              Contraseña *
            </Label>
            <div class="relative">
              <Lock class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                v-model="formData.password"
                :class="{ 'border-destructive': errors.password && hasAttemptedSubmit }"
                autocomplete="new-password"
                class="pl-9"
                placeholder="••••••••"
                type="password"
                @blur="validatePassword"
                @input="hasAttemptedSubmit && validatePassword()"
              />
            </div>
            <p class="text-xs text-muted-foreground">
              Mínimo 8 caracteres con mayúscula, minúscula y número
            </p>
            <p
              v-if="errors.password && hasAttemptedSubmit"
              class="text-sm font-medium text-destructive"
            >
              {{ errors.password }}
            </p>
          </div>

          <!-- Confirmar contraseña -->
          <div class="space-y-2">
            <Label for="confirmPassword">
              Confirmar Contraseña *
            </Label>
            <div class="relative">
              <Lock class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                v-model="formData.confirmPassword"
                :class="{ 'border-destructive': errors.confirmPassword && hasAttemptedSubmit }"
                autocomplete="new-password"
                class="pl-9"
                placeholder="••••••••"
                type="password"
                @blur="validateConfirmPassword"
                @input="hasAttemptedSubmit && validateConfirmPassword()"
              />
            </div>
            <p
              v-if="errors.confirmPassword && hasAttemptedSubmit"
              class="text-sm font-medium text-destructive"
            >
              {{ errors.confirmPassword }}
            </p>
          </div>

          <!-- Rol -->
          <div class="space-y-2">
            <Label for="role">
              Rol *
            </Label>
            <div class="relative">
              <Shield class="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
              <Select v-model="formData.role" @update:model-value="validateRole">
                <SelectTrigger
                  :class="{ 'border-destructive': errors.role && hasAttemptedSubmit }"
                  class="pl-9"
                >
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supervisor">
                    {{ getRoleLabel('supervisor') }}
                  </SelectItem>
                  <SelectItem value="chief">
                    {{ getRoleLabel('chief') }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p
              v-if="errors.role && hasAttemptedSubmit"
              class="text-sm font-medium text-destructive"
            >
              {{ errors.role }}
            </p>
          </div>

          <!-- Botón de envío -->
          <Button
            :disabled="isLoading"
            class="w-full"
            size="lg"
            type="submit"
          >
            <Spinner v-if="isLoading" class="h-4 w-4 mr-2" />
            <UserPlus v-else class="h-4 w-4 mr-2" />
            {{ isLoading ? 'Registrando...' : 'Crear Cuenta' }}
          </Button>
        </form>

        <!-- Enlace a login -->
        <div class="mt-4 text-center text-sm text-muted-foreground">
          <p>
            ¿Ya tienes cuenta?
            <Button
              class="p-0 h-auto font-normal"
              variant="link"
              @click="router.push({ name: 'Login' })"
            >
              Inicia sesión aquí
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
