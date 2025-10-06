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

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const role = ref<'supervisor' | 'chief'>('supervisor')
const isLoading = ref(false)
const errorMessage = ref('')

const errors = reactive({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: ''
})

function validateField(field: string) {
  switch (field) {
    case 'fullName':
      errors.fullName = !fullName.value.trim()
        ? 'Nombre completo requerido'
        : fullName.value.trim().split(' ').length < 2
          ? 'Ingrese nombre y apellido'
          : ''
      break
    case 'email':
      errors.email = !email.value
        ? 'Email requerido'
        : !/^\S+@\S+\.\S+$/.test(email.value)
          ? 'Formato de email inválido'
          : ''
      break
    case 'password':
      errors.password = !password.value
        ? 'Contraseña requerida'
        : password.value.length < 8
          ? 'Mínimo 8 caracteres'
          : !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password.value)
            ? 'Debe incluir mayúscula, minúscula y número'
            : ''
      break
    case 'confirmPassword':
      errors.confirmPassword = !confirmPassword.value
        ? 'Confirme la contraseña'
        : password.value !== confirmPassword.value
          ? 'Las contraseñas no coinciden'
          : ''
      break
    case 'role':
      errors.role = !role.value ? 'Seleccione un rol' : ''
      break
  }
}

function validateAllFields(): boolean {
  validateField('fullName')
  validateField('email')
  validateField('password')
  validateField('confirmPassword')
  validateField('role')
  return !Object.values(errors).some(error => error)
}

async function handleRegister() {
  errorMessage.value = ''

  if (!validateAllFields()) return

  isLoading.value = true

  try {
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
    if (!authData.user) throw new Error('No se pudo crear el usuario')

    // Esperar que el trigger cree el perfil automáticamente
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Verificar autenticación
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

    errorMessage.value = error.message.includes('User already registered')
      ? 'El usuario ya está registrado. Intenta iniciar sesión.'
      : error.message.includes('Password should be at least')
        ? 'La contraseña debe cumplir los requisitos de seguridad.'
        : error.message.includes('Invalid email')
          ? 'Formato de email inválido.'
          : error.message || 'Error al registrar usuario'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Card class="max-w-md mx-auto">
    <CardHeader>
      <CardTitle>Crear Cuenta</CardTitle>
      <CardDescription>Ingresa tus datos para crear una nueva cuenta</CardDescription>
    </CardHeader>
    <CardContent>
      <form class="space-y-4" @submit.prevent="handleRegister">
        <div>
          <Label for="fullName">Nombre Completo</Label>
          <Input
            id="fullName"
            v-model="fullName"
            :class="{ 'border-destructive': errors.fullName }"
            placeholder="Juan Pérez"
            type="text"
            @blur="validateField('fullName')"
          />
          <p v-if="errors.fullName" class="text-destructive text-sm mt-1">{{ errors.fullName }}</p>
        </div>

        <div>
          <Label for="email">Email</Label>
          <Input
            id="email"
            v-model="email"
            :class="{ 'border-destructive': errors.email }"
            placeholder="juan@ejemplo.com"
            type="email"
            @blur="validateField('email')"
          />
          <p v-if="errors.email" class="text-destructive text-sm mt-1">{{ errors.email }}</p>
        </div>

        <div>
          <Label for="password">Contraseña</Label>
          <Input
            id="password"
            v-model="password"
            :class="{ 'border-destructive': errors.password }"
            placeholder="********"
            type="password"
            @blur="validateField('password')"
          />
          <p v-if="errors.password" class="text-destructive text-sm mt-1">{{ errors.password }}</p>
        </div>

        <div>
          <Label for="confirmPassword">Confirmar Contraseña</Label>
          <Input
            id="confirmPassword"
            v-model="confirmPassword"
            :class="{ 'border-destructive': errors.confirmPassword }"
            placeholder="********"
            type="password"
            @blur="validateField('confirmPassword')"
          />
          <p v-if="errors.confirmPassword" class="text-destructive text-sm mt-1">{{ errors.confirmPassword }}</p>
        </div>

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
          <p v-if="errors.role" class="text-destructive text-sm mt-1">{{ errors.role }}</p>
        </div>

        <div v-if="errorMessage" class="text-destructive text-sm">{{ errorMessage }}</div>

        <Button :disabled="isLoading" class="w-full" type="submit">
          <span v-if="isLoading" class="animate-spin mr-2">🔄</span>
          {{ isLoading ? 'Registrando...' : 'Crear Cuenta' }}
        </Button>
      </form>
    </CardContent>
  </Card>
</template>
