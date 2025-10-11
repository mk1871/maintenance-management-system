<script lang="ts" setup>
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Info } from 'lucide-vue-next'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'

import { accommodationService, type Accommodation } from '@/composables/accommodationService'

// Props
const props = defineProps<{
  accommodation: Accommodation | null
  open: boolean
}>()

// Emits
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'updated'): void
}>()

// Interfaces
interface FormData {
  name: string
  address: string
  notes: string
  status: 'active' | 'inactive'
}

interface FormErrors {
  name: string
  address: string
}

// State
const formData = ref<FormData>({
  name: '',
  address: '',
  notes: '',
  status: 'active',
})

const errors = ref<FormErrors>({
  name: '',
  address: '',
})

const isSaving = ref(false)

/**
 * Inicializa el formulario con los datos del alojamiento
 */
const initializeForm = (): void => {
  if (!props.accommodation) return

  formData.value = {
    name: props.accommodation.name || '',
    address: props.accommodation.address || '',
    notes: props.accommodation.notes || '',
    status: props.accommodation.status || 'active',
  }

  // Limpiar errores
  errors.value = {
    name: '',
    address: '',
  }
}

/**
 * Valida el formulario
 */
const validateForm = (): boolean => {
  let isValid = true

  // Validar nombre
  if (!formData.value.name || formData.value.name.trim().length < 3) {
    errors.value.name = 'El nombre debe tener al menos 3 caracteres'
    isValid = false
  } else {
    errors.value.name = ''
  }

  return isValid
}

/**
 * Guarda los cambios del alojamiento
 */
const handleSave = async (): Promise<void> => {
  if (!props.accommodation) return

  if (!validateForm()) {
    toast.error('Por favor, corrige los errores del formulario')
    return
  }

  isSaving.value = true

  try {
    await accommodationService.update({
      id: props.accommodation.id,
      name: formData.value.name.trim(),
      address: formData.value.address.trim() || undefined,
      notes: formData.value.notes.trim() || undefined,
      status: formData.value.status,
    })

    toast.success('Alojamiento actualizado exitosamente')
    emit('updated')
    closeDialog()
  } catch (error: unknown) {
    console.error(error)
    const errorMessage = (error as Error).message || 'Error al actualizar el alojamiento'
    toast.error(errorMessage)
  } finally {
    isSaving.value = false
  }
}

/**
 * Cierra el dialog
 */
const closeDialog = (): void => {
  emit('update:open', false)
}

/**
 * Obtiene la variante del badge según el estado
 */
const getStatusVariant = (status: string): 'default' | 'secondary' => {
  return status === 'active' ? 'default' : 'secondary'
}

/**
 * Obtiene el label del estado
 */
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
  }
  return labels[status] || status
}

// Watch para inicializar el formulario cuando se abre el dialog
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      initializeForm()
    }
  },
  { immediate: true },
)

// Watch para re-inicializar si cambia el accommodation
watch(
  () => props.accommodation,
  () => {
    if (props.open) {
      initializeForm()
    }
  },
)
</script>

<template>
  <Dialog :open="props.open" @update:open="closeDialog">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Editar Alojamiento</DialogTitle>
        <DialogDescription>
          Código: <strong>{{ props.accommodation?.code }}</strong> (no editable)
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <!-- Nombre -->
        <div class="space-y-2">
          <Label for="name"> Nombre * </Label>
          <Input
            id="name"
            v-model="formData.name"
            :class="{ 'border-destructive': errors.name }"
            placeholder="Nombre del alojamiento"
            type="text"
          />
          <p v-if="errors.name" class="text-sm font-medium text-destructive">
            {{ errors.name }}
          </p>
        </div>

        <!-- Dirección -->
        <div class="space-y-2">
          <Label for="address"> Dirección </Label>
          <Input
            id="address"
            v-model="formData.address"
            placeholder="Dirección completa"
            type="text"
          />
          <p class="text-xs text-muted-foreground">Opcional</p>
        </div>

        <!-- Estado -->
        <div class="space-y-2">
          <Label>Estado</Label>
          <Select v-model="formData.status">
            <SelectTrigger>
              <SelectValue>
                <Badge :variant="getStatusVariant(formData.status)">
                  {{ getStatusLabel(formData.status) }}
                </Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">
                <Badge variant="default">Activo</Badge>
              </SelectItem>
              <SelectItem value="inactive">
                <Badge variant="secondary">Inactivo</Badge>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Notas -->
        <div class="space-y-2">
          <Label for="notes"> Notas </Label>
          <Textarea
            id="notes"
            v-model="formData.notes"
            placeholder="Notas adicionales sobre el alojamiento..."
            rows="3"
          />
          <p class="text-xs text-muted-foreground">Opcional</p>
        </div>

        <!-- Aviso sobre áreas -->
        <div class="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          <div class="flex items-start gap-2">
            <Info class="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p class="font-medium">Nota sobre áreas configuradas</p>
              <p class="mt-1 text-xs">
                La edición de áreas y elementos se realizará en una funcionalidad futura dedicada
                para evitar inconsistencias en tareas existentes.
              </p>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button :disabled="isSaving" type="button" variant="outline" @click="closeDialog">
          Cancelar
        </Button>
        <Button :disabled="isSaving" @click="handleSave">
          <Spinner v-if="isSaving" class="mr-2 h-4 w-4" />
          {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
