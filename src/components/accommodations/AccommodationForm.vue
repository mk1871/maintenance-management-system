<script lang="ts" setup>
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'
import { useRouter } from 'vue-router'

// Componentes UI
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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

// Composables
import {
  accommodationService,
  type CreateAccommodationData,
} from '@/composables/accommodationService'

// Emits
const emit = defineEmits<{
  (e: 'accommodation-created'): void
}>()

const router = useRouter()

// Interfaces
interface FormData {
  code: string
  name: string
  address: string
  status: 'active' | 'inactive'
}

interface AreaOption {
  value: string
  label: string
}

interface FormErrors {
  code: string
  name: string
}

// Constantes de configuración
const MIN_CODE_LENGTH = 2
const MAX_CODE_LENGTH = 4
const MIN_NAME_LENGTH = 3
const CODE_PATTERN = /^[A-Z0-9]+$/

const AREA_OPTIONS: AreaOption[] = [
  { value: 'living_room', label: 'Sala de Estar' },
  { value: 'kitchen', label: 'Cocina' },
  { value: 'bathroom_1', label: 'Baño Principal' },
  { value: 'bathroom_2', label: 'Segundo Baño' },
  { value: 'bedroom_1', label: 'Dormitorio Principal' },
  { value: 'bedroom_2', label: 'Segundo Dormitorio' },
  { value: 'bedroom_3', label: 'Tercer Dormitorio' },
  { value: 'terrace', label: 'Terraza' },
  { value: 'garage', label: 'Garaje' },
]

// Estado
const formData = ref<FormData>({
  code: '',
  name: '',
  address: '',
  status: 'active',
})

// Áreas seleccionadas
const areas = ref<Record<string, boolean>>({
  living_room: false,
  kitchen: false,
  bathroom_1: false,
  bathroom_2: false,
  bedroom_1: false,
  bedroom_2: false,
  bedroom_3: false,
  terrace: false,
  garage: false,
})

const errors = ref<FormErrors>({
  code: '',
  name: '',
})

const isSubmitting = ref(false)
const isDialogOpen = ref(false)

/**
 * Contador de áreas seleccionadas
 */
const selectedAreasCount = computed(() => {
  return Object.values(areas.value).filter(Boolean).length
})

/**
 * Valida que al menos un área esté seleccionada
 */
const hasSelectedAreas = computed(() => {
  return selectedAreasCount.value > 0
})

/**
 * Verifica si el formulario es válido para envío
 */
const isFormValid = computed(() => {
  return (
    !errors.value.code &&
    !errors.value.name &&
    formData.value.code.length >= MIN_CODE_LENGTH &&
    formData.value.name.length >= MIN_NAME_LENGTH &&
    hasSelectedAreas.value
  )
})

/**
 * Valida el campo código del alojamiento
 */
const validateCode = (): void => {
  const code = formData.value.code.trim()

  if (!code) {
    errors.value.code = 'El código es requerido'
    return
  }

  if (code.length < MIN_CODE_LENGTH || code.length > MAX_CODE_LENGTH) {
    errors.value.code = `El código debe tener entre ${MIN_CODE_LENGTH} y ${MAX_CODE_LENGTH} caracteres`
    return
  }

  if (!CODE_PATTERN.test(code)) {
    errors.value.code = 'Solo se permiten letras mayúsculas y números'
    return
  }

  errors.value.code = ''
}

/**
 * Valida el campo nombre del alojamiento
 */
const validateName = (): void => {
  const name = formData.value.name.trim()

  if (!name) {
    errors.value.name = 'El nombre es requerido'
    return
  }

  if (name.length < MIN_NAME_LENGTH) {
    errors.value.name = `El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres`
    return
  }

  errors.value.name = ''
}

/**
 * Convierte el objeto de áreas al formato de base de datos
 */
const buildConfiguredAreas = (): Record<string, string[]> => {
  return Object.fromEntries(
    Object.entries(areas.value)
      .filter(([, isSelected]) => isSelected)
      .map(([areaKey]) => [areaKey, []])
  )
}

/**
 * Resetea el formulario a su estado inicial
 */
const resetForm = (): void => {
  formData.value = {
    code: '',
    name: '',
    address: '',
    status: 'active',
  }
  areas.value = {
    living_room: false,
    kitchen: false,
    bathroom_1: false,
    bathroom_2: false,
    bedroom_1: false,
    bedroom_2: false,
    bedroom_3: false,
    terrace: false,
    garage: false,
  }
  errors.value.code = ''
  errors.value.name = ''
}

/**
 * Maneja la creación de un nuevo alojamiento
 */
const handleCreate = async (): Promise<void> => {
  validateCode()
  validateName()

  if (!isFormValid.value) {
    if (!hasSelectedAreas.value) {
      toast.error('Debes seleccionar al menos un área')
    } else {
      toast.error('Por favor, corrige los errores del formulario')
    }
    return
  }

  isSubmitting.value = true

  const accommodationData: CreateAccommodationData = {
    code: formData.value.code.trim().toUpperCase(),
    name: formData.value.name.trim(),
    address: formData.value.address.trim(),
    status: formData.value.status,
    configured_areas: buildConfiguredAreas(),
  }

  try {
    await accommodationService.create(accommodationData)
    toast.success('Alojamiento creado exitosamente')
    emit('accommodation-created')
    resetForm()
    isDialogOpen.value = false
    router.push({ name: 'Accommodations' })
  } catch (error: unknown) {
    console.error('Error al crear alojamiento:', error)
    toast.error((error as Error).message || 'Error al crear el alojamiento')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="isDialogOpen">
    <DialogTrigger as-child>
      <Button>Nuevo Alojamiento</Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Crear Alojamiento</DialogTitle>
        <DialogDescription>
          Completa la información del nuevo alojamiento. Los campos marcados son obligatorios.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-6 py-4">
        <!-- Código -->
        <div class="space-y-2">
          <Label>
            Código *
            <span class="text-xs text-muted-foreground ml-2"> (2-4 caracteres: A-Z, 0-9) </span>
          </Label>
          <Input
            v-model="formData.code"
            :class="{ 'border-destructive': errors.code }"
            maxlength="4"
            placeholder="Ej: AP01"
            @blur="validateCode"
            @input="formData.code = formData.code.toUpperCase()"
          />
          <p v-if="errors.code" class="text-sm font-medium text-destructive">
            {{ errors.code }}
          </p>
        </div>

        <!-- Nombre -->
        <div class="space-y-2">
          <Label>Nombre *</Label>
          <Input
            v-model="formData.name"
            :class="{ 'border-destructive': errors.name }"
            placeholder="Ej: Apartamento Centro"
            @blur="validateName"
          />
          <p v-if="errors.name" class="text-sm font-medium text-destructive">
            {{ errors.name }}
          </p>
        </div>

        <!-- Dirección -->
        <div class="space-y-2">
          <Label>Dirección</Label>
          <Input v-model="formData.address" placeholder="Ej: Calle Mayor 123, 3º B" />
          <p class="text-xs text-muted-foreground">Opcional</p>
        </div>

        <!-- Estado -->
        <div class="space-y-2">
          <Label>Estado *</Label>
          <Select v-model="formData.status">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Áreas con checkbox estilizado como shadcn-vue -->
        <div class="space-y-2">
          <Label>Áreas del Alojamiento *</Label>
          <p class="text-sm text-muted-foreground mb-2">
            Selecciona las áreas que tiene este alojamiento
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded-md p-4">
            <div
              v-for="option in AREA_OPTIONS"
              :key="option.value"
              class="flex items-center space-x-2"
            >
              <input
                :id="option.value"
                v-model="areas[option.value]"
                class="peer h-4 w-4 shrink-0 rounded-[4px] border border-input shadow-xs transition-shadow cursor-pointer
               focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring
               disabled:cursor-not-allowed disabled:opacity-50
               checked:bg-primary checked:text-primary-foreground checked:border-primary
               hover:border-ring/50"
                type="checkbox"
              />
              <Label :for="option.value" class="cursor-pointer text-sm font-normal">
                {{ option.label }}
              </Label>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">
            Áreas seleccionadas: {{ selectedAreasCount }}
          </p>
        </div>

      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" @click="isDialogOpen = false">
          Cancelar
        </Button>
        <Button :disabled="!isFormValid || isSubmitting" @click="handleCreate">
          <Spinner v-if="isSubmitting" class="h-4 w-4 mr-2" />
          {{ isSubmitting ? 'Creando...' : 'Crear Alojamiento' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
