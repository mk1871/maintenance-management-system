<script lang="ts" setup>
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'

import { useAccommodationsStore } from '@/stores/accommodations'
import type { Accommodation } from '@/composables/accommodationService'

const props = defineProps<{
  accommodation: Accommodation
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'updated'): void
  (e: 'update:open', value: boolean): void
}>()

interface FormData {
  code: string
  name: string
  address: string
  status: 'active' | 'inactive'
  notes: string
}

interface FormErrors {
  code: string
  name: string
}

const MIN_CODE_LENGTH = 1
const MAX_CODE_LENGTH = 4
const MIN_NAME_LENGTH = 3
const CODE_PATTERN = /^[A-Z0-9]+$/

const accommodationsStore = useAccommodationsStore()

const formData = ref<FormData>({
  code: '',
  name: '',
  address: '',
  status: 'active',
  notes: '',
})

const errors = ref<FormErrors>({
  code: '',
  name: '',
})

const isSubmitting = ref(false)

/**
 * Inicializa el formulario con los datos del accommodation
 */
const initializeForm = (): void => {
  formData.value = {
    code: props.accommodation.code,
    name: props.accommodation.name,
    address: props.accommodation.address || '',
    status: props.accommodation.status,
    notes: props.accommodation.notes || '',
  }
  errors.value = { code: '', name: '' }
}

/**
 * Valida el formulario
 */
const validateForm = (): boolean => {
  errors.value = { code: '', name: '' }
  let isValid = true

  // Validar código
  if (!formData.value.code.trim()) {
    errors.value.code = 'El código es requerido'
    isValid = false
  } else if (
    formData.value.code.length < MIN_CODE_LENGTH ||
    formData.value.code.length > MAX_CODE_LENGTH
  ) {
    errors.value.code = `El código debe tener entre ${MIN_CODE_LENGTH} y ${MAX_CODE_LENGTH} caracteres`
    isValid = false
  } else if (!CODE_PATTERN.test(formData.value.code)) {
    errors.value.code = 'El código solo puede contener letras mayúsculas y números'
    isValid = false
  }

  // Validar nombre
  if (!formData.value.name.trim()) {
    errors.value.name = 'El nombre es requerido'
    isValid = false
  } else if (formData.value.name.length < MIN_NAME_LENGTH) {
    errors.value.name = `El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres`
    isValid = false
  }

  return isValid
}

/**
 * Maneja el submit del formulario
 */
const handleSubmit = async (): Promise<void> => {
  if (!validateForm()) {
    toast.error('Por favor corrige los errores del formulario')
    return
  }

  try {
    isSubmitting.value = true

    await accommodationsStore.updateAccommodation(props.accommodation.id, {
      code: formData.value.code.toUpperCase(),
      name: formData.value.name,
      address: formData.value.address || undefined,
      status: formData.value.status,
      notes: formData.value.notes || undefined,
    })

    emit('updated')
  } catch (error: unknown) {
    console.error(error)
    toast.error('Error al actualizar el alojamiento')
  } finally {
    isSubmitting.value = false
  }
}

/**
 * Cierra el dialog
 */
const handleClose = (): void => {
  emit('update:open', false)
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      initializeForm()
    }
  },
  { immediate: true },
)
</script>

<template>
  <Dialog :open="open" @update:open="(value) => emit('update:open', value)">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Editar Alojamiento</DialogTitle>
        <DialogDescription>
          Modifica los datos del alojamiento {{ accommodation.code }}
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <!-- Código -->
        <div class="space-y-2">
          <Label for="edit-code">Código *</Label>
          <Input
            id="edit-code"
            v-model="formData.code"
            :class="{ 'border-destructive': errors.code }"
            maxlength="4"
            placeholder="Ej: A101"
          />
          <p v-if="errors.code" class="text-sm font-medium text-destructive">
            {{ errors.code }}
          </p>
        </div>

        <!-- Nombre -->
        <div class="space-y-2">
          <Label for="edit-name">Nombre *</Label>
          <Input
            id="edit-name"
            v-model="formData.name"
            :class="{ 'border-destructive': errors.name }"
            placeholder="Nombre del alojamiento"
          />
          <p v-if="errors.name" class="text-sm font-medium text-destructive">
            {{ errors.name }}
          </p>
        </div>

        <!-- Dirección -->
        <div class="space-y-2">
          <Label for="edit-address">Dirección</Label>
          <Input id="edit-address" v-model="formData.address" placeholder="Dirección completa" />
        </div>

        <!-- Estado -->
        <div class="space-y-2">
          <Label for="edit-status">Estado</Label>
          <Select id="edit-status" v-model="formData.status">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Notas -->
        <div class="space-y-2">
          <Label for="edit-notes">Notas</Label>
          <Textarea
            id="edit-notes"
            v-model="formData.notes"
            placeholder="Notas adicionales..."
            rows="3"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose"> Cancelar </Button>
        <Button :disabled="isSubmitting" @click="handleSubmit">
          <Spinner v-if="isSubmitting" class="mr-2 h-4 w-4" />
          {{ isSubmitting ? 'Actualizando...' : 'Actualizar' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
