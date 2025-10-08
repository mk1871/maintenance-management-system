<script lang="ts" setup>
import { ref, watch } from 'vue'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Constantes
const MIN_CODE_LENGTH = 2
const MAX_CODE_LENGTH = 4
const MIN_NAME_LENGTH = 3
const CODE_PATTERN = /^[A-Z0-9]+$/

// Interfaces
interface BasicInfo {
  code: string
  name: string
  address: string
  status: 'active' | 'inactive'
}

interface BasicInfoErrors {
  code: string
  name: string
}

// Props
const props = defineProps<{
  modelValue: BasicInfo
  errors: BasicInfoErrors
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: BasicInfo]
  'update:errors': [value: BasicInfoErrors]
  'validate': []
}>()

const localValue = ref<BasicInfo>({ ...props.modelValue })
const localErrors = ref<BasicInfoErrors>({ ...props.errors })

/**
 * Sincroniza cambios locales con el padre
 */
watch(
  localValue,
  (newValue) => {
    emit('update:modelValue', newValue)
  },
  { deep: true }
)

/**
 * Valida el código del alojamiento
 */
const validateCode = (): void => {
  const code = localValue.value.code.trim()

  if (!code) {
    localErrors.value.code = 'El código es requerido'
  } else if (code.length < MIN_CODE_LENGTH || code.length > MAX_CODE_LENGTH) {
    localErrors.value.code = `Debe tener entre ${MIN_CODE_LENGTH} y ${MAX_CODE_LENGTH} caracteres`
  } else if (!CODE_PATTERN.test(code)) {
    localErrors.value.code = 'Solo letras mayúsculas y números'
  } else {
    localErrors.value.code = ''
  }

  emit('update:errors', localErrors.value)
}

/**
 * Valida el nombre del alojamiento
 */
const validateName = (): void => {
  const name = localValue.value.name.trim()

  if (!name) {
    localErrors.value.name = 'El nombre es requerido'
  } else if (name.length < MIN_NAME_LENGTH) {
    localErrors.value.name = `Mínimo ${MIN_NAME_LENGTH} caracteres`
  } else {
    localErrors.value.name = ''
  }

  emit('update:errors', localErrors.value)
}

/**
 * Convierte el código a mayúsculas automáticamente
 */
const handleCodeInput = (): void => {
  localValue.value.code = localValue.value.code.toUpperCase()
}
</script>

<template>
  <div class="grid gap-4">
    <!-- Código -->
    <div class="space-y-2">
      <Label>
        Código *
        <span class="text-xs text-muted-foreground ml-2">
          ({{ MIN_CODE_LENGTH }}-{{ MAX_CODE_LENGTH }} caracteres: A-Z, 0-9)
        </span>
      </Label>
      <Input
        v-model="localValue.code"
        :class="{ 'border-destructive': localErrors.code }"
        :maxlength="MAX_CODE_LENGTH"
        placeholder="Ej: AP01"
        @blur="validateCode"
        @input="handleCodeInput"
      />
      <p v-if="localErrors.code" class="text-sm font-medium text-destructive">
        {{ localErrors.code }}
      </p>
    </div>

    <!-- Nombre -->
    <div class="space-y-2">
      <Label>Nombre *</Label>
      <Input
        v-model="localValue.name"
        :class="{ 'border-destructive': localErrors.name }"
        placeholder="Ej: Apartamento Centro"
        @blur="validateName"
      />
      <p v-if="localErrors.name" class="text-sm font-medium text-destructive">
        {{ localErrors.name }}
      </p>
    </div>

    <!-- Dirección -->
    <div class="space-y-2">
      <Label>Dirección</Label>
      <Input v-model="localValue.address" placeholder="Ej: Calle Mayor 123, 3º B" />
      <p class="text-xs text-muted-foreground">Opcional</p>
    </div>

    <!-- Estado -->
    <div class="space-y-2">
      <Label>Estado *</Label>
      <Select v-model="localValue.status">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Activo</SelectItem>
          <SelectItem value="inactive">Inactivo</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</template>
