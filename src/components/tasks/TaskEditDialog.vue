<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { toast } from 'vue-sonner'
import { CalendarIcon, Edit } from 'lucide-vue-next'
import type { DateValue } from '@internationalized/date'
import { DateFormatter, getLocalTimeZone, parseDate, today } from '@internationalized/date'

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
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import { useTasksStore } from '@/stores/tasks'
import type { TaskWithRelations, TaskPriority } from '@/composables/taskService'

// Props
const props = defineProps<{
  task: TaskWithRelations
}>()

const emit = defineEmits<{
  (e: 'updated'): void
}>()

const tasksStore = useTasksStore()

// Estado
const isOpen = ref(false)
const isSubmitting = ref(false)
const isCalendarOpen = ref(false)

// Form data
const formData = ref({
  description: '',
  priority: 'medium' as TaskPriority,
  due_date: '',
  estimated_cost: '',
  assigned_to: '',
  notes: '',
})

// Errores
const errors = ref({
  description: '',
  due_date: '',
})

// Date formatter
const TIME_ZONE = getLocalTimeZone()
const dateFormatter = new DateFormatter('es-ES', { dateStyle: 'medium' })

// ✅ NUEVO: Computed para deshabilitar edición si tarea completada/cancelada
const canEdit = computed(() => {
  return props.task.status !== 'completed' && props.task.status !== 'cancelled'
})

/**
 * Inicializa el formulario con datos de la tarea
 */
const initializeForm = (): void => {
  formData.value = {
    description: props.task.description,
    priority: props.task.priority,
    due_date: props.task.due_date,
    estimated_cost: props.task.estimated_cost?.toString() || '',
    assigned_to: props.task.assigned_to || '',
    notes: props.task.notes || '',
  }
  errors.value = {
    description: '',
    due_date: '',
  }
}

/**
 * Valida el formulario
 */
const validateForm = (): boolean => {
  let isValid = true

  if (formData.value.description.length < 10) {
    errors.value.description = 'La descripción debe tener al menos 10 caracteres'
    isValid = false
  } else {
    errors.value.description = ''
  }

  const dueDate = new Date(formData.value.due_date)
  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)

  if (dueDate < todayDate) {
    errors.value.due_date = 'La fecha debe ser hoy o posterior'
    isValid = false
  } else {
    errors.value.due_date = ''
  }

  return isValid
}

/**
 * ✅ NUEVO: Maneja cambio de fecha y cierra el calendario
 */
const handleDateUpdate = (value: DateValue | undefined): void => {
  if (!value) return
  formData.value.due_date = value.toString()
  errors.value.due_date = ''
  // Cerrar el popover automáticamente
  isCalendarOpen.value = false
}

/**
 * Convierte string a DateValue para el calendar
 */
const stringToDateValue = (dateString: string | undefined): DateValue | undefined => {
  if (!dateString) return undefined
  try {
    return parseDate(dateString)
  } catch {
    return undefined
  }
}

/**
 * Formatea fecha para mostrar
 */
const formatDateForDisplay = (dateString: string | undefined): string => {
  if (!dateString) return 'Seleccionar fecha'

  const dateValue = stringToDateValue(dateString)
  if (!dateValue) return 'Seleccionar fecha'

  return dateFormatter.format(dateValue.toDate(TIME_ZONE))
}

/**
 * ✅ ACTUALIZADO: Guarda los cambios usando el store de Pinia
 */
const handleSubmit = async (): Promise<void> => {
  if (!validateForm()) {
    toast.error('Por favor, corrige los errores del formulario')
    return
  }

  isSubmitting.value = true

  try {
    await tasksStore.updateTask(props.task.id, {
      description: formData.value.description,
      priority: formData.value.priority,
      due_date: formData.value.due_date,
      estimated_cost: formData.value.estimated_cost
        ? parseFloat(formData.value.estimated_cost)
        : undefined,
      assigned_to: formData.value.assigned_to || undefined,
      notes: formData.value.notes || undefined,
    })

    emit('updated')
    isOpen.value = false
  } catch (error: unknown) {
    console.error(error)
  } finally {
    isSubmitting.value = false
  }
}

/**
 * Traduce prioridad
 */
const translatePriority = (priority: string): string => {
  const translations: Record<string, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
  }
  return translations[priority] || priority
}

// Watch para inicializar cuando se abre el dialog
watch(isOpen, (newValue) => {
  if (newValue) {
    initializeForm()
  }
})
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <Button :disabled="!canEdit" variant="outline">
        <Edit class="h-4 w-4 mr-2" />
        Editar Tarea
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Editar Tarea</DialogTitle>
        <DialogDescription>
          Modifica los detalles de la tarea #{{ task.id.substring(0, 8) }}
          <span v-if="!canEdit" class="block text-destructive mt-1">
            ⚠️ No se puede editar una tarea completada o cancelada
          </span>
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <!-- Descripción -->
        <div class="space-y-2">
          <Label for="description">Descripción *</Label>
          <Textarea
            id="description"
            v-model="formData.description"
            :class="{ 'border-destructive': errors.description }"
            :disabled="!canEdit"
            placeholder="Describe el problema..."
            rows="4"
          />
          <p v-if="errors.description" class="text-sm font-medium text-destructive">
            {{ errors.description }}
          </p>
        </div>

        <!-- Prioridad y Fecha en grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Prioridad -->
          <div class="space-y-2">
            <Label>Prioridad *</Label>
            <Select v-model="formData.priority" :disabled="!canEdit">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{{ translatePriority('low') }}</SelectItem>
                <SelectItem value="medium">{{ translatePriority('medium') }}</SelectItem>
                <SelectItem value="high">{{ translatePriority('high') }}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Fecha de Vencimiento -->
          <div class="space-y-2">
            <Label>Fecha de Vencimiento *</Label>
            <Popover v-model:open="isCalendarOpen">
              <PopoverTrigger as-child>
                <Button
                  :class="
                    cn(
                      'w-full justify-start text-left font-normal',
                      !formData.due_date && 'text-muted-foreground',
                      errors.due_date && 'border-destructive',
                    )
                  "
                  :disabled="!canEdit"
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
                  :min-value="today(TIME_ZONE)"
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
        </div>

        <!-- Costo Estimado y Asignado a -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Costo Estimado -->
          <div class="space-y-2">
            <Label for="estimated_cost">Costo Estimado (€)</Label>
            <Input
              id="estimated_cost"
              v-model="formData.estimated_cost"
              :disabled="!canEdit"
              min="0"
              placeholder="0.00"
              step="0.01"
              type="number"
            />
          </div>

          <!-- Asignado a -->
          <div class="space-y-2">
            <Label for="assigned_to">Asignado a</Label>
            <Input
              id="assigned_to"
              v-model="formData.assigned_to"
              :disabled="!canEdit"
              placeholder="Nombre del responsable"
            />
          </div>
        </div>

        <!-- Notas -->
        <div class="space-y-2">
          <Label for="notes">Notas Adicionales</Label>
          <Textarea
            id="notes"
            v-model="formData.notes"
            :disabled="!canEdit"
            placeholder="Notas opcionales..."
            rows="3"
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" @click="isOpen = false">Cancelar</Button>
        <Button :disabled="isSubmitting || !canEdit" type="button" @click="handleSubmit">
          {{ isSubmitting ? 'Guardando...' : 'Guardar Cambios' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
