<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { z } from 'zod'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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
import { useFormValidation } from '@/composables/useFormValidation'
import type { AccommodationArea, AccommodationElement } from '@/composables/accommodationAreaService'

// Emits
const emit = defineEmits<{
  (e: 'task-created'): void
}>()

// Zod Schema
const taskFormSchema = z.object({
  accommodation_id: z.string().min(1, 'Alojamiento requerido'),
  accommodation_area_id: z.string().min(1, 'Área requerida'),
  accommodation_element_id: z.string().min(1, 'Elemento requerido'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  priority: z.enum(['low', 'medium', 'high']),
  due_date: z.string().refine(
    (date) => new Date(date) > new Date(),
    'La fecha debe ser futura'
  ),
  estimated_cost: z.string().optional(),
  assigned_to: z.string().optional(),
})

type TaskFormValues = z.infer<typeof taskFormSchema>

// Composables
const { getAreasByAccommodation } = useAccommodationAreaService()
const form = useFormValidation(taskFormSchema, {
  priority: 'medium',
  due_date: today(getLocalTimeZone()).add({ days: 1 }).toString(),
})

// State
const accommodations = ref<Accommodation[]>([])
const configuredAreas = ref<AccommodationArea[]>([])
const isDialogOpen = ref(false)
const isLoadingAreas = ref(false)
const isSubmitting = ref(false)

const df = new DateFormatter('es-ES', {
  dateStyle: 'long',
})

/**
 * Carga los alojamientos
 */
const loadAccommodations = async (): Promise<void> => {
  try {
    accommodations.value = await accommodationService.getAll()
  } catch (error: unknown) {
    console.error(error)
    toast.error('Error al cargar alojamientos')
  }
}

/**
 * Carga las áreas configuradas de un alojamiento
 */
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

onMounted(async () => {
  await loadAccommodations()
})

/**
 * Observa cambios en el alojamiento para cargar áreas
 */
watch(
  () => form.values.accommodation_id,
  async (newAccommodationId) => {
    if (newAccommodationId) {
      await loadConfiguredAreas(newAccommodationId)
    } else {
      configuredAreas.value = []
    }

    form.setFieldValue('accommodation_area_id', '')
    form.setFieldValue('accommodation_element_id', '')
  }
)

/**
 * Observa cambios en el área para limpiar elemento
 */
watch(
  () => form.values.accommodation_area_id,
  () => {
    form.setFieldValue('accommodation_element_id', '')
  }
)

/**
 * Obtiene los elementos del área seleccionada
 */
const availableElements = computed((): AccommodationElement[] => {
  const areaId = form.values.accommodation_area_id
  if (!areaId) return []

  const selectedArea = configuredAreas.value.find((area) => area.id === areaId)
  return selectedArea?.elements || []
})

/**
 * Construye el label de un área
 */
const buildAreaLabel = (area: AccommodationArea): string => {
  const baseLabel = area.custom_label || area.area_catalog?.label || 'Área'
  return area.room_number ? `${baseLabel} ${area.room_number}` : baseLabel
}

/**
 * Obtiene el nombre de un elemento
 */
const getElementName = (element: AccommodationElement): string => {
  return element.custom_name || element.element_catalog?.name || 'Elemento'
}

/**
 * Obtiene variante de badge según prioridad
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
 * Obtiene label de prioridad
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
 * Convierte string ISO a DateValue
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
 * Formatea una fecha para mostrar
 */
const formatDateForDisplay = (dateString: string | undefined): string => {
  if (!dateString) return 'Seleccionar fecha'

  const dateValue = stringToDateValue(dateString)
  if (!dateValue) return 'Seleccionar fecha'

  return df.format(dateValue.toDate(getLocalTimeZone()))
}

/**
 * Maneja el submit del formulario
 */
const onSubmit = form.handleSubmit(async (values: TaskFormValues) => {
  isSubmitting.value = true

  try {
    await taskService.create({
      accommodation_id: values.accommodation_id,
      accommodation_area_id: values.accommodation_area_id,
      accommodation_element_id: values.accommodation_element_id,
      description: values.description,
      priority: values.priority,
      due_date: values.due_date,
      estimated_cost: values.estimated_cost ? parseFloat(values.estimated_cost) : undefined,
      assigned_to: values.assigned_to,
    })

    toast.success('Tarea creada exitosamente')
    emit('task-created')
    form.resetForm()
    isDialogOpen.value = false
  } catch (error: unknown) {
    console.error(error)
    toast.error((error as Error).message || 'Error al crear la tarea')
  } finally {
    isSubmitting.value = false
  }
})
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

      <Form>
        <form class="grid gap-6 py-4" @submit="onSubmit">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Alojamiento -->
            <FormField v-slot="{ componentField }" name="accommodation_id">
              <FormItem>
                <FormLabel>Alojamiento *</FormLabel>
                <Select v-bind="componentField">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar alojamiento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem v-for="acc in accommodations" :key="acc.id" :value="acc.id">
                      {{ acc.code }} - {{ acc.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </FormField>

            <!-- Prioridad -->
            <FormField v-slot="{ componentField }" name="priority">
              <FormItem>
                <FormLabel>Prioridad *</FormLabel>
                <Select v-bind="componentField">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue>
                        <Badge :variant="getPriorityVariant(componentField.modelValue)">
                          {{ getPriorityLabel(componentField.modelValue) }}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
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
                <FormMessage />
              </FormItem>
            </FormField>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Área -->
            <FormField v-slot="{ componentField }" name="accommodation_area_id">
              <FormItem>
                <FormLabel>Área *</FormLabel>
                <Select
                  :disabled="!form.values.accommodation_id || isLoadingAreas"
                  v-bind="componentField"
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar área" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem v-for="area in configuredAreas" :key="area.id" :value="area.id">
                      {{ buildAreaLabel(area) }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </FormField>

            <!-- Elemento -->
            <FormField v-slot="{ componentField }" name="accommodation_element_id">
              <FormItem>
                <FormLabel>Elemento *</FormLabel>
                <Select
                  :disabled="!form.values.accommodation_area_id"
                  v-bind="componentField"
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar elemento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem v-for="element in availableElements" :key="element.id" :value="element.id">
                      {{ getElementName(element) }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>

          <!-- Descripción -->
          <FormField v-slot="{ componentField }" name="description">
            <FormItem>
              <FormLabel>Descripción *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe detalladamente el problema o tarea a realizar..."
                  rows="4"
                  v-bind="componentField"
                />
              </FormControl>
              <p class="text-xs text-muted-foreground">
                {{ (componentField.modelValue || '').length }}/10 caracteres mínimo
              </p>
              <FormMessage />
            </FormItem>
          </FormField>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Fecha de Vencimiento -->
            <FormField v-slot="{ componentField }" name="due_date">
              <FormItem>
                <FormLabel>Fecha de Vencimiento *</FormLabel>
                <Popover>
                  <PopoverTrigger as-child>
                    <FormControl>
                      <Button
                        :class="cn(
                          'w-full justify-start text-left font-normal',
                          !componentField.modelValue && 'text-muted-foreground',
                        )"
                        variant="outline"
                      >
                        <CalendarIcon class="mr-2 h-4 w-4" />
                        {{ formatDateForDisplay(componentField.modelValue) }}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent align="start" class="w-auto p-0">
                    <Calendar
                      :model-value="stringToDateValue(componentField.modelValue)"
                      initial-focus
                      locale="es"
                      @update:model-value="(value) => {
                        if (value) {
                          componentField['onUpdate:modelValue'](value.toString())
                        }
                      }"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            </FormField>

            <!-- Costo Estimado -->
            <FormField v-slot="{ componentField }" name="estimated_cost">
              <FormItem>
                <FormLabel>Costo Estimado (€)</FormLabel>
                <FormControl>
                  <Input
                    min="0"
                    placeholder="0.00"
                    step="0.01"
                    type="number"
                    v-bind="componentField"
                  />
                </FormControl>
                <p class="text-xs text-muted-foreground">Opcional</p>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>

          <DialogFooter class="gap-2">
            <Button type="button" variant="outline" @click="isDialogOpen = false">
              Cancelar
            </Button>
            <Button :disabled="isSubmitting" type="submit">
              <Spinner v-if="isSubmitting" class="h-4 w-4 mr-2" />
              {{ isSubmitting ? 'Creando...' : 'Crear Tarea' }}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  </Dialog>
</template>
