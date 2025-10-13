<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { today, getLocalTimeZone } from '@internationalized/date'

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
import { Spinner } from '@/components/ui/spinner'

import TaskFormAccommodationFields from '@/components/tasks/form/TaskFormAccommodationFields.vue'
import TaskFormDetailsFields from '@/components/tasks/form/TaskFormDetailsFields.vue'

import { useTasksStore } from '@/stores/tasks'
import { useAccommodationsStore } from '@/stores/accommodations'
import { useAccommodationAreaService } from '@/composables/accommodationAreaService'
import type { AccommodationArea } from '@/composables/accommodationAreaService'

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

const tasksStore = useTasksStore()
const accommodationsStore = useAccommodationsStore()
const { getAreasByAccommodation } = useAccommodationAreaService()

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

const configuredAreas = ref<AccommodationArea[]>([])
const isLoadingAreas = ref(false)
const isSubmitting = ref(false)
const isDatePickerOpen = ref(false)
const internalDialogOpen = ref(false)

const showTaskForm = computed({
  get: () => (props.isOpen === undefined ? internalDialogOpen.value : props.isOpen),
  set: (value: boolean) => {
    if (props.isOpen === undefined) {
      internalDialogOpen.value = value
    } else if (!value) {
      emit('close')
    }
  },
})

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

const validateForm = (): boolean => {
  let isValid = true
  errors.value = {
    accommodation_id: '',
    accommodation_area_id: '',
    accommodation_element_id: '',
    description: '',
    due_date: '',
  }

  if (!formData.value.accommodation_id) {
    errors.value.accommodation_id = 'Selecciona un alojamiento'
    isValid = false
  }

  if (!formData.value.accommodation_area_id) {
    errors.value.accommodation_area_id = 'Selecciona un área'
    isValid = false
  }

  if (!formData.value.accommodation_element_id) {
    errors.value.accommodation_element_id = 'Selecciona un elemento'
    isValid = false
  }

  if (formData.value.description.length < 10) {
    errors.value.description = 'La descripción debe tener al menos 10 caracteres'
    isValid = false
  }

  if (formData.value.description.length > 500) {
    errors.value.description = 'La descripción no puede exceder 500 caracteres'
    isValid = false
  }

  return isValid
}

const handleSubmit = async (): Promise<void> => {
  if (!validateForm()) {
    toast.error('Por favor, corrige los errores del formulario')
    return
  }

  isSubmitting.value = true

  try {
    await tasksStore.createTask({
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

    emit('task-created')
    showTaskForm.value = false
    resetForm()
  } catch (error: unknown) {
    console.error(error)
  } finally {
    isSubmitting.value = false
  }
}

watch(
  () => formData.value.accommodation_id,
  (newId) => {
    if (newId) {
      loadConfiguredAreas(newId)
      formData.value.accommodation_area_id = ''
      formData.value.accommodation_element_id = ''
    }
  },
)

watch(
  () => formData.value.accommodation_area_id,
  () => {
    formData.value.accommodation_element_id = ''
  },
)

watch(showTaskForm, (isOpen) => {
  if (isOpen && formData.value.accommodation_id) {
    loadConfiguredAreas(formData.value.accommodation_id)
  }
})

onMounted(async () => {
  await accommodationsStore.fetchAccommodations()
})
</script>

<template>
  <Dialog v-model:open="showTaskForm">
    <DialogTrigger as-child>
      <slot>
        <Button>Nueva Tarea</Button>
      </slot>
    </DialogTrigger>
    <DialogContent class="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Crear Nueva Tarea</DialogTitle>
        <DialogDescription>
          Completa el formulario para registrar una nueva tarea de mantenimiento
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6 py-4">
        <TaskFormAccommodationFields
          v-model:accommodation-id="formData.accommodation_id"
          v-model:area-id="formData.accommodation_area_id"
          v-model:element-id="formData.accommodation_element_id"
          :accommodations="accommodationsStore.accommodations"
          :areas="configuredAreas"
          :errors="errors"
          :is-loading-areas="isLoadingAreas"
        />

        <TaskFormDetailsFields
          v-model:description="formData.description"
          v-model:due-date="formData.due_date"
          v-model:estimated-cost="formData.estimated_cost"
          v-model:is-date-picker-open="isDatePickerOpen"
          v-model:priority="formData.priority"
          v-model:repairer-name="formData.repairer_name"
          :errors="errors"
        />
      </div>

      <DialogFooter>
        <Button variant="outline" @click="showTaskForm = false"> Cancelar </Button>
        <Button :disabled="isSubmitting" @click="handleSubmit">
          <Spinner v-if="isSubmitting" class="mr-2 h-4 w-4" />
          {{ isSubmitting ? 'Creando...' : 'Crear Tarea' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
