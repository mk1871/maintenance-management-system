<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { DateFormatter, getLocalTimeZone, parseDate, today } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import { CalendarIcon } from 'lucide-vue-next'

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
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import { taskService } from '@/composables/taskService'
import { accommodationService, type Accommodation } from '@/composables/accommodationService'
import { useAccommodationAreaService } from '@/composables/accommodationAreaService'
import type {
  AccommodationArea,
  AccommodationElement,
} from '@/composables/accommodationAreaService'

const props = withDefaults(
  defineProps<{
    isOpen?: boolean
    defaultAccommodationId?: string
  }>(),
  {
    isOpen: undefined,
    defaultAccommodationId: '',
  },
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'task-created'): void
}>()

interface FormData {
  accommodation_id: string
  accommodation_area_id: string
  accommodation_element_id: string
  description: string
  priority: 'low' | 'medium' | 'high'
  due_date: string
  estimated_cost: string
  repairer_name: string
}

interface FormErrors {
  accommodation_id: string
  accommodation_area_id: string
  accommodation_element_id: string
  description: string
  due_date: string
}

const { getAreasByAccommodation } = useAccommodationAreaService()

const formData = ref<FormData>({
  accommodation_id: props.defaultAccommodationId || '',
  accommodation_area_id: '',
  accommodation_element_id: '',
  description: '',
  priority: 'medium',
  due_date: today(getLocalTimeZone()).add({ days: 1 }).toString(),
  estimated_cost: '',
  repairer_name: '',
})

const errors = ref<FormErrors>({
  accommodation_id: '',
  accommodation_area_id: '',
  accommodation_element_id: '',
  description: '',
  due_date: '',
})

const accommodations = ref<Accommodation[]>([])
const configuredAreas = ref<AccommodationArea[]>([])
const isLoadingAreas = ref(false)
const isSubmitting = ref(false)
const isDatePickerOpen = ref(false)
const internalDialogOpen = ref(false)

const showTaskForm = computed({
  get: () => {
    if (props.isOpen === undefined) {
      return internalDialogOpen.value
    }
    return props.isOpen
  },
  set: (value: boolean) => {
    if (props.isOpen === undefined) {
      internalDialogOpen.value = value
    } else {
      if (!value) {
        emit('close')
      }
    }
  },
})

const df = new DateFormatter('es-ES', {
  dateStyle: 'long',
})

const loadAccommodations = async (): Promise<void> => {
  try {
    accommodations.value = await accommodationService.getAll()
  } catch (error: unknown) {
    console.error(error)
    toast.error('Error al cargar alojamientos')
  }
}

const loadConfiguredAreas = async (accommodationId: string): Promise<void> => {
  if (!accommodationId) {
    configuredAreas.value = []
    return
  }

  isLoadingAreas.value = true
  try {
    configuredAreas.value = await getAreasByAccommodation(accommodationId)
  } catch (error: unknown) {
    console.error(error)
    toast.error('Error al cargar áreas del alojamiento')
    configuredAreas.value = []
  } finally {
    isLoadingAreas.value = false
  }
}

const availableElements = computed((): AccommodationElement[] => {
  const areaId = formData.value.accommodation_area_id
  if (!areaId) return []

  const selectedArea = configuredAreas.value.find((area) => area.id === areaId)
  return selectedArea?.elements || []
})

const buildAreaLabel = (area: AccommodationArea): string => {
  const baseLabel = area.custom_label || area.area_catalog?.label || 'Área'
  return area.room_number ? `${baseLabel} ${area.room_number}` : baseLabel
}

const getElementName = (element: AccommodationElement): string => {
  return element.custom_name || element.element_catalog?.name || 'Elemento'
}

const getPriorityVariant = (priority: string): 'default' | 'destructive' | 'secondary' => {
  const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
    low: 'secondary',
    medium: 'default',
    high: 'destructive',
  }
  return variants[priority] ?? 'default'
}

const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
  }
  return labels[priority] ?? priority
}

const stringToDateValue = (dateString: string | undefined): DateValue | undefined => {
  if (!dateString) return undefined
  try {
    return parseDate(dateString)
  } catch {
    return undefined
  }
}

const formatDateForDisplay = (dateString: string | undefined): string => {
  if (!dateString) return 'Seleccionar fecha'

  const dateValue = stringToDateValue(dateString)
  if (!dateValue) return 'Seleccionar fecha'

  return df.format(dateValue.toDate(getLocalTimeZone()))
}

const handleDateUpdate = (value: DateValue | undefined): void => {
  if (!value) return

  formData.value.due_date = value.toString()
  isDatePickerOpen.value = false
  errors.value.due_date = ''
}

const validateForm = (): boolean => {
  let isValid = true

  if (!formData.value.accommodation_id) {
    errors.value.accommodation_id = 'Alojamiento requerido'
    isValid = false
  } else {
    errors.value.accommodation_id = ''
  }

  if (!formData.value.accommodation_area_id) {
    errors.value.accommodation_area_id = 'Área requerida'
    isValid = false
  } else {
    errors.value.accommodation_area_id = ''
  }

  if (!formData.value.accommodation_element_id) {
    errors.value.accommodation_element_id = 'Elemento requerido'
    isValid = false
  } else {
    errors.value.accommodation_element_id = ''
  }

  if (formData.value.description.length < 10) {
    errors.value.description = 'La descripción debe tener al menos 10 caracteres'
    isValid = false
  } else {
    errors.value.description = ''
  }

  const dueDate = new Date(formData.value.due_date)
  if (dueDate <= new Date()) {
    errors.value.due_date = 'La fecha debe ser futura'
    isValid = false
  } else {
    errors.value.due_date = ''
  }

  return isValid
}

const resetForm = (): void => {
  formData.value = {
    accommodation_id: props.defaultAccommodationId || '',
    accommodation_area_id: '',
    accommodation_element_id: '',
    description: '',
    priority: 'medium',
    due_date: today(getLocalTimeZone()).add({ days: 1 }).toString(),
    estimated_cost: '',
    repairer_name: '',
  }
  errors.value = {
    accommodation_id: '',
    accommodation_area_id: '',
    accommodation_element_id: '',
    description: '',
    due_date: '',
  }
  configuredAreas.value = []
}

const handleSubmit = async (): Promise<void> => {
  if (!validateForm()) {
    toast.error('Por favor, corrige los errores del formulario')
    return
  }

  isSubmitting.value = true

  try {
    await taskService.create({
      accommodation_id: formData.value.accommodation_id,
      accommodation_area_id: formData.value.accommodation_area_id,
      accommodation_element_id: formData.value.accommodation_element_id,
      description: formData.value.description,
      priority: formData.value.priority,
      due_date: formData.value.due_date,
      estimated_cost: formData.value.estimated_cost
        ? parseFloat(formData.value.estimated_cost)
        : undefined,
      repairer_name: formData.value.repairer_name || undefined,
    })

    toast.success('Tarea creada exitosamente')
    emit('task-created')
    resetForm()
    showTaskForm.value = false
  } catch (error: unknown) {
    console.error(error)
    toast.error('Error al crear la tarea')
  } finally {
    isSubmitting.value = false
  }
}

const handleDialogClose = (open: boolean): void => {
  if (!open) {
    if (props.isOpen !== undefined) {
      emit('close')
    } else {
      internalDialogOpen.value = false
    }
  }
}

watch(
  () => formData.value.accommodation_id,
  async (newId) => {
    if (newId) {
      await loadConfiguredAreas(newId)
    } else {
      configuredAreas.value = []
    }
    formData.value.accommodation_area_id = ''
    formData.value.accommodation_element_id = ''
  },
)

watch(
  () => formData.value.accommodation_area_id,
  () => {
    formData.value.accommodation_element_id = ''
  },
)

watch(
  () => props.defaultAccommodationId,
  async (newValue) => {
    if (newValue) {
      formData.value.accommodation_id = newValue
      await loadConfiguredAreas(newValue)
    }
  },
  { immediate: true },
)

watch(
  () => showTaskForm.value,
  (isOpen) => {
    if (isOpen) {
      resetForm()
      if (props.defaultAccommodationId) {
        formData.value.accommodation_id = props.defaultAccommodationId
        loadConfiguredAreas(props.defaultAccommodationId)
      }
    }
  },
)

onMounted(async () => {
  await loadAccommodations()

  if (props.defaultAccommodationId) {
    await loadConfiguredAreas(props.defaultAccommodationId)
  }
})
</script>

<template>
  <Dialog v-model:open="showTaskForm" @update:open="handleDialogClose">
    <DialogTrigger v-if="isOpen === undefined" as-child>
      <Button>Nueva Tarea</Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Crear Tarea de Mantenimiento</DialogTitle>
        <DialogDescription>
          Completa los detalles de la nueva tarea. Los campos marcados con * son obligatorios.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-6 py-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Alojamiento -->
          <div class="space-y-2">
            <Label for="accommodation">Alojamiento *</Label>
            <Select id="accommodation" v-model="formData.accommodation_id">
              <SelectTrigger :class="{ 'border-destructive': errors.accommodation_id }">
                <SelectValue placeholder="Seleccionar alojamiento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="acc in accommodations" :key="acc.id" :value="acc.id">
                  {{ acc.code }} - {{ acc.name }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="errors.accommodation_id" class="text-sm font-medium text-destructive">
              {{ errors.accommodation_id }}
            </p>
          </div>

          <!-- Prioridad -->
          <div class="space-y-2">
            <Label for="priority">Prioridad *</Label>
            <Select id="priority" v-model="formData.priority">
              <SelectTrigger>
                <SelectValue>
                  <Badge :variant="getPriorityVariant(formData.priority)">
                    {{ getPriorityLabel(formData.priority) }}
                  </Badge>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <Badge variant="secondary">Baja</Badge>
                </SelectItem>
                <SelectItem value="medium">
                  <Badge variant="default">Media</Badge>
                </SelectItem>
                <SelectItem value="high">
                  <Badge variant="destructive">Alta</Badge>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Área -->
          <div class="space-y-2">
            <Label for="area">Área *</Label>
            <Select
              id="area"
              v-model="formData.accommodation_area_id"
              :disabled="!formData.accommodation_id || isLoadingAreas"
            >
              <SelectTrigger :class="{ 'border-destructive': errors.accommodation_area_id }">
                <SelectValue placeholder="Seleccionar área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="area in configuredAreas" :key="area.id" :value="area.id">
                  {{ buildAreaLabel(area) }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="errors.accommodation_area_id" class="text-sm font-medium text-destructive">
              {{ errors.accommodation_area_id }}
            </p>
          </div>

          <!-- Elemento -->
          <div class="space-y-2">
            <Label for="element">Elemento *</Label>
            <Select
              id="element"
              v-model="formData.accommodation_element_id"
              :disabled="!formData.accommodation_area_id"
            >
              <SelectTrigger :class="{ 'border-destructive': errors.accommodation_element_id }">
                <SelectValue placeholder="Seleccionar elemento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="element in availableElements"
                  :key="element.id"
                  :value="element.id"
                >
                  {{ getElementName(element) }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="errors.accommodation_element_id" class="text-sm font-medium text-destructive">
              {{ errors.accommodation_element_id }}
            </p>
          </div>
        </div>

        <!-- Descripción -->
        <div class="space-y-2">
          <Label for="description">Descripción *</Label>
          <Textarea
            id="description"
            v-model="formData.description"
            :class="{ 'border-destructive': errors.description }"
            placeholder="Describe el problema o tarea a realizar..."
            rows="4"
          />
          <p v-if="errors.description" class="text-sm font-medium text-destructive">
            {{ errors.description }}
          </p>
          <p v-else class="text-sm text-muted-foreground">
            Mínimo 10 caracteres ({{ formData.description.length }}/10)
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Fecha de Vencimiento con Popover cerrable -->
          <div class="space-y-2">
            <Label for="due-date">Fecha de Vencimiento *</Label>
            <Popover v-model:open="isDatePickerOpen">
              <PopoverTrigger as-child>
                <Button
                  id="due-date"
                  :class="
                    cn(
                      'w-full justify-start text-left font-normal',
                      !formData.due_date && 'text-muted-foreground',
                      errors.due_date && 'border-destructive',
                    )
                  "
                  type="button"
                  variant="outline"
                >
                  <CalendarIcon class="mr-2 h-4 w-4" />
                  {{ formatDateForDisplay(formData.due_date) }}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" class="w-auto p-0">
                <Calendar
                  :locale="'es'"
                  :model-value="stringToDateValue(formData.due_date)"
                  initial-focus
                  @update:model-value="handleDateUpdate"
                />
              </PopoverContent>
            </Popover>
            <p v-if="errors.due_date" class="text-sm font-medium text-destructive">
              {{ errors.due_date }}
            </p>
          </div>

          <!-- Costo Estimado -->
          <div class="space-y-2">
            <Label for="estimated-cost">Costo Estimado (€)</Label>
            <Input
              id="estimated-cost"
              v-model="formData.estimated_cost"
              min="0"
              placeholder="0.00"
              step="0.01"
              type="number"
            />
          </div>
        </div>

        <!-- Asignado a -->
        <div class="space-y-2">
          <Label for="assigned-to">Asignado a</Label>
          <Input
            id="assigned-to"
            v-model="formData.repairer_name"
            placeholder="Nombre del responsable (opcional)"
            type="text"
          />
        </div>
      </div>

      <DialogFooter>
        <Button :disabled="isSubmitting" type="button" variant="outline" @click="resetForm">
          Limpiar
        </Button>
        <Button :disabled="isSubmitting" type="submit" @click="handleSubmit">
          <Spinner v-if="isSubmitting" class="mr-2 h-4 w-4" />
          {{ isSubmitting ? 'Creando...' : 'Crear Tarea' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
