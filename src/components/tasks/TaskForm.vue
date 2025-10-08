<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import type { DateValue } from '@internationalized/date'
import { DateFormatter, getLocalTimeZone, today } from '@internationalized/date'
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

import { type CreateTaskData, taskService } from '@/composables/taskService'
import { type Accommodation, accommodationService } from '@/composables/accommodationService'

// Emitir evento cuando se cree una tarea
const emit = defineEmits<{
  (e: 'task-created'): void
}>()

// Constantes
const AREA_LABELS: Record<string, string> = {
  living_room: 'Sala de Estar',
  kitchen: 'Cocina',
  bathroom_1: 'Baño Principal',
  bathroom_2: 'Segundo Baño',
  bedroom_1: 'Dormitorio Principal',
  bedroom_2: 'Segundo Dormitorio',
  bedroom_3: 'Tercer Dormitorio',
  terrace: 'Terraza',
  garage: 'Garaje',
}

interface TaskFormData {
  accommodation_id: string
  area: string
  element: string
  description: string
  priority: 'low' | 'medium' | 'high'
  due_date: unknown
  estimated_cost: string
}

const accommodations = ref<Accommodation[]>([])
const formData = ref<TaskFormData>({
  accommodation_id: '',
  area: '',
  element: '',
  description: '',
  priority: 'medium',
  due_date: undefined,
  estimated_cost: '',
})

const errors = reactive({
  accommodation_id: '',
  area: '',
  element: '',
  description: '',
  due_date: '',
})

const isSubmitting = ref(false)
const isDialogOpen = ref(false)

const df = new DateFormatter('es-ES', {
  dateStyle: 'long',
})

/**
 * Traduce una clave de área a su etiqueta en español
 */
const getAreaLabel = (areaKey: string): string => {
  return AREA_LABELS[areaKey] || areaKey
}

/**
 * Carga los alojamientos desde la base de datos
 */
const loadAccommodations = async (): Promise<void> => {
  try {
    accommodations.value = await accommodationService.getAll()
  } catch (err: unknown) {
    console.error(err)
    toast.error('Error al cargar alojamientos')
  }
}

onMounted(async () => {
  await loadAccommodations()
  const tomorrow = today(getLocalTimeZone()).add({ days: 1 })
  formData.value.due_date = tomorrow
})

/**
 * Obtiene las áreas disponibles del alojamiento seleccionado
 */
const areas = computed(() => {
  const id = formData.value.accommodation_id
  if (!id) return []
  const acc = accommodations.value.find((a) => a.id === id)
  if (!acc?.configured_areas) return []
  return Object.keys(acc.configured_areas)
})

/**
 * Obtiene los elementos disponibles del área seleccionada
 */
const elements = computed(() => {
  const { accommodation_id, area } = formData.value
  if (!accommodation_id || !area) return []
  const acc = accommodations.value.find((a) => a.id === accommodation_id)
  if (!acc?.configured_areas?.[area]) return []
  return acc.configured_areas[area]
})

/**
 * Valida si el formulario está completo y correcto
 */
const isFormValid = computed(
  () =>
    !!formData.value.accommodation_id &&
    !!formData.value.area &&
    !!formData.value.element &&
    formData.value.description.length >= 10 &&
    !!formData.value.due_date &&
    !errors.description &&
    !errors.due_date,
)

/**
 * Retorna la variante de badge según prioridad
 */
const getPriorityVariant = (priority: string): 'default' | 'destructive' | 'secondary' => {
  const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
    low: 'secondary',
    medium: 'default',
    high: 'destructive',
  }
  return variants[priority] ?? 'default'
}

/**
 * Retorna la etiqueta traducida de la prioridad
 */
const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
  }
  return labels[priority] ?? priority
}

/**
 * Valida un campo específico del formulario
 */
const validateField = (field: keyof typeof errors): void => {
  switch (field) {
    case 'accommodation_id':
      errors.accommodation_id = !formData.value.accommodation_id ? 'Alojamiento requerido' : ''
      break
    case 'area':
      errors.area = !formData.value.area ? 'Área requerida' : ''
      break
    case 'element':
      errors.element = !formData.value.element ? 'Elemento requerido' : ''
      break
    case 'description': {
      const desc = formData.value.description
      errors.description = !desc
        ? 'Descripción requerida'
        : desc.length < 10
          ? 'Mínimo 10 caracteres'
          : ''
      break
    }
    case 'due_date': {
      const date = formData.value.due_date as DateValue | undefined
      const now = today(getLocalTimeZone())
      errors.due_date = !date
        ? 'Fecha de vencimiento requerida'
        : date.compare(now) < 0
          ? 'La fecha debe ser futura'
          : ''
      break
    }
  }
}

/**
 * Resetea el formulario a su estado inicial
 */
const resetForm = (): void => {
  const tomorrow = today(getLocalTimeZone()).add({ days: 1 })
  formData.value = {
    accommodation_id: '',
    area: '',
    element: '',
    description: '',
    priority: 'medium',
    due_date: tomorrow,
    estimated_cost: '',
  }
  Object.keys(errors).forEach((key) => {
    errors[key as keyof typeof errors] = ''
  })
}

/**
 * Maneja la creación de una nueva tarea
 */
const handleCreate = async (): Promise<void> => {
  validateField('accommodation_id')
  validateField('area')
  validateField('element')
  validateField('description')
  validateField('due_date')

  if (!isFormValid.value) {
    toast.error('Por favor, completa todos los campos requeridos')
    return
  }

  const data: CreateTaskData = {
    accommodation_id: formData.value.accommodation_id,
    area: formData.value.area,
    element: formData.value.element,
    description: formData.value.description,
    priority: formData.value.priority,
    due_date: (formData.value.due_date as DateValue).toString(),
    estimated_cost: formData.value.estimated_cost
      ? parseFloat(formData.value.estimated_cost)
      : undefined,
  }

  isSubmitting.value = true
  try {
    await taskService.create(data)
    toast.success('Tarea creada exitosamente')
    emit('task-created')
    resetForm()
    isDialogOpen.value = false
  } catch (err: unknown) {
    console.error(err)
    toast.error((err as Error).message || 'Error al crear la tarea')
  } finally {
    isSubmitting.value = false
  }
}

/**
 * Maneja el cambio de alojamiento, limpiando área y elemento
 */
const handleAccommodationChange = (): void => {
  formData.value.area = ''
  formData.value.element = ''
  errors.accommodation_id = ''
}

/**
 * Maneja el cambio de área, limpiando elemento
 */
const handleAreaChange = (): void => {
  formData.value.element = ''
  errors.area = ''
}
</script>

<template>
  <Dialog v-model:open="isDialogOpen">
    <DialogTrigger as-child>
      <Button>Nueva Tarea</Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Crear Tarea de Mantenimiento</DialogTitle>
        <DialogDescription>
          Completa los detalles de la nueva tarea. Los campos marcados son obligatorios.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-6 py-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Alojamiento -->
          <div class="space-y-2">
            <Label>Alojamiento *</Label>
            <Select
              v-model="formData.accommodation_id"
              @update:model-value="handleAccommodationChange"
            >
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
            <Label>Prioridad *</Label>
            <Select v-model="formData.priority">
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
            <Label>Área *</Label>
            <Select
              v-model="formData.area"
              :disabled="!formData.accommodation_id"
              @update:model-value="handleAreaChange"
            >
              <SelectTrigger :class="{ 'border-destructive': errors.area }">
                <SelectValue placeholder="Seleccionar área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="a in areas" :key="a" :value="a">
                  {{ getAreaLabel(a) }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="errors.area" class="text-sm font-medium text-destructive">
              {{ errors.area }}
            </p>
          </div>

          <!-- Elemento -->
          <div class="space-y-2">
            <Label>Elemento *</Label>
            <Select v-model="formData.element" :disabled="!formData.area">
              <SelectTrigger :class="{ 'border-destructive': errors.element }">
                <SelectValue placeholder="Seleccionar elemento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="e in elements" :key="e" :value="e">
                  {{ e }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="errors.element" class="text-sm font-medium text-destructive">
              {{ errors.element }}
            </p>
          </div>
        </div>

        <!-- Descripción -->
        <div class="space-y-2">
          <Label>Descripción *</Label>
          <Textarea
            v-model="formData.description"
            :class="{ 'border-destructive': errors.description }"
            placeholder="Describe detalladamente el problema o tarea a realizar..."
            rows="4"
            @blur="validateField('description')"
          />
          <p class="text-xs text-muted-foreground">
            {{ formData.description.length }}/10 caracteres mínimo
          </p>
          <p v-if="errors.description" class="text-sm font-medium text-destructive">
            {{ errors.description }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- DatePicker -->
          <div class="space-y-2">
            <Label>Fecha de Vencimiento *</Label>
            <Popover>
              <PopoverTrigger as-child>
                <Button
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
                  {{
                    formData.due_date
                      ? df.format((formData.due_date as DateValue).toDate(getLocalTimeZone()))
                      : 'Seleccionar fecha'
                  }}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" class="w-auto p-0">
                <Calendar
                  :locale="'es'"
                  :model-value="formData.due_date as DateValue"
                  initial-focus
                  @update:model-value="
                    (val) => {
                      formData.due_date = val
                      validateField('due_date')
                    }
                  "
                />
              </PopoverContent>
            </Popover>
            <p v-if="errors.due_date" class="text-sm font-medium text-destructive">
              {{ errors.due_date }}
            </p>
          </div>

          <!-- Costo Estimado -->
          <div class="space-y-2">
            <Label>Costo Estimado (€)</Label>
            <Input
              v-model="formData.estimated_cost"
              min="0"
              placeholder="0.00"
              step="0.01"
              type="number"
            />
            <p class="text-xs text-muted-foreground">Opcional</p>
          </div>
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" @click="isDialogOpen = false">Cancelar</Button>
        <Button :disabled="!isFormValid || isSubmitting" @click="handleCreate">
          <Spinner v-if="isSubmitting" class="h-4 w-4 mr-2" />
          {{ isSubmitting ? 'Creando...' : 'Crear Tarea' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
