<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'vue-sonner'

const router = useRouter()
const authStore = useAuthStore()

// State
const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const role = ref<'supervisor' | 'chief'>('supervisor')
const isLoading = ref(false)
const errorMessage = ref('')

// Validations
const errors = reactive({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: ''
})

const validateField = (field: string) => {
  switch (field) {
    case 'fullName':
      if (!fullName.value.trim()) {
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
      } else if (!/^\S+@\S+\.\S+$/.test(email.value)) {
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
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password.value)) {
        errors.password = 'Debe incluir mayúscula, minúscula y número'
      } else {
        errors.password = ''
      }
      break
    case 'confirmPassword':
      if (!confirmPassword.value) {
        errors.confirmPassword = 'Confirme la contraseña'
      } else if (password.value !== confirmPassword.value) {
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

const validateAllFields = () => {
  validateField('fullName')
  validateField('email')
  validateField('password')
  validateField('confirmPassword')
  validateField('role')
  return !Object.values(errors).some(error => error)
}

const handleRegister = async () => {
  errorMessage.value = ''

  if (!validateAllFields()) return

  isLoading.value = true

  try {
    // Registrar usuario en Supabase Auth con nueva API
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        data: {
          full_name: fullName.value.trim(),
          role: role.value
        }
      }
    })

    if (authError) throw authError

    if (!authData.user) {
      throw new Error('No se pudo crear el usuario')
    }

    // Crear perfil en tabla users (fallback si trigger falla)
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        full_name: fullName.value.trim(),
        role: role.value,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    // Si hay error de perfil (ej. duplicado por trigger), ignorar
    if (profileError && !profileError.message.includes('duplicate key')) {
      console.warn('Profile creation warning:', profileError)
    }

    // Verificar estado de autenticación
    await authStore.checkAuth()

    if (authStore.isAuthenticated) {
      toast.success(`¡Registro exitoso! Bienvenido, ${fullName.value}`)
      router.push({ name: 'Home' })
    } else {
      toast.success('Registro completado. Por favor, inicia sesión.')
      router.push({ name: 'Login' })
    }
  } catch (err: unknown) {
    const error = err as Error
    console.error('Registration error:', error)

    if (error.message.includes('User already registered')) {
      errorMessage.value = 'El usuario ya está registrado. Intenta iniciar sesión.'
    } else if (error.message.includes('Password should be at least')) {
      errorMessage.value = 'La contraseña debe cumplir los requisitos de seguridad.'
    } else if (error.message.includes('Invalid email')) {
      errorMessage.value = 'Formato de email inválido.'
    } else {
      errorMessage.value = error.message || 'Error al registrar usuario'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Card class="max-w-md mx-auto">
    <CardHeader>
      <CardTitle>Crear Cuenta</CardTitle>
      <CardDescription>
        Ingresa tus datos para crear una nueva cuenta
      </CardDescription>
    </CardHeader>
    <CardContent>
      <form class="space-y-4" @submit.prevent="handleRegister">
        <!-- Nombre completo -->
        <div>
          <Label for="fullName">Nombre Completo</Label>
          <Input
            id="fullName"
            v-model="fullName"
            :class="{ 'border-destructive': errors.fullName }"
            placeholder="Juan Pérez"
            required
            type="text"
            @blur="validateField('fullName')"
          />
          <p v-if="errors.fullName" class="text-destructive text-sm mt-1">
            {{ errors.fullName }}
          </p>
        </div>

        <!-- Email -->
        <div>
          <Label for="email">Email</Label>
          <Input
            id="email"
            v-model="email"
            :class="{ 'border-destructive': errors.email }"
            placeholder="juan@ejemplo.com"
            required
            type="email"
            @blur="validateField('email')"
          />
          <p v-if="errors.email" class="text-destructive text-sm mt-1">
            {{ errors.email }}
          </p>
        </div>

        <!-- Contraseña -->
        <div>
          <Label for="password">Contraseña</Label>
          <Input
            id="password"
            v-model="password"
            :class="{ 'border-destructive': errors.password }"
            placeholder="********"
            required
            type="password"
            @blur="validateField('password')"
          />
          <p v-if="errors.password" class="text-destructive text-sm mt-1">
            {{ errors.password }}
          </p>
        </div>

        <!-- Confirmar contraseña -->
        <div>
          <Label for="confirmPassword">Confirmar Contraseña</Label>
          <Input
            id="confirmPassword"
            v-model="confirmPassword"
            :class="{ 'border-destructive': errors.confirmPassword }"
            placeholder="********"
            required
            type="password"
            @blur="validateField('confirmPassword')"
          />
          <p v-if="errors.confirmPassword" class="text-destructive text-sm mt-1">
            {{ errors.confirmPassword }}
          </p>
        </div>

        <!-- Rol -->
        <div>
          <Label for="role">Rol</Label>
          <Select v-model="role" @update:model-value="validateField('role')">
            <SelectTrigger :class="{ 'border-destructive': errors.role }">
              <SelectValue placeholder="Selecciona un rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="supervisor">Supervisor</SelectItem>
              <SelectItem value="chief">Chief</SelectItem>
            </SelectContent>
          </Select>
          <p v-if="errors.role" class="text-destructive text-sm mt-1">
            {{ errors.role }}
          </p>
        </div>

        <!-- Error general -->
        <div v-if="errorMessage" class="text-destructive text-sm">
          {{ errorMessage }}
        </div>

        <!-- Botón registro -->
        <Button :disabled="isLoading" class="w-full" type="submit">
          <span v-if="isLoading" class="animate-spin mr-2">🔄</span>
          {{ isLoading ? 'Registrando...' : 'Crear Cuenta' }}
        </Button>
      </form>
    </CardContent>
  </Card>
</template>
