<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { z } from 'zod'
import { toast } from 'vue-sonner'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'

import AreaSelector, { type SelectedArea } from './AreaSelector.vue'
import AreaElementsConfig, { type SelectedElement } from './AreaElementsConfig.vue'

import { useFormValidation } from '@/composables/useFormValidation'
import { useAccommodationForm } from '@/composables/useAccommodationForm'
import { accommodationService } from '@/composables/accommodationService'
import { useAreaCatalogService } from '@/composables/areaCatalogService'
import type { AreaCatalog, ElementCatalog } from '@/composables/areaCatalogService'

// Emits
const emit = defineEmits<{
  (e: 'accommodation-created'): void
}>()

// Zod Schema
const accommodationFormSchema = z.object({
  code: z
    .string()
    .min(1, 'Código requerido')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[A-Z0-9-]+$/, 'Solo mayúsculas, números y guiones'),
  name: z.string().min(3, 'Mínimo 3 caracteres').max(100, 'Máximo 100 caracteres'),
  address: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  notes: z.string().optional(),
})

type AccommodationFormValues = z.infer<typeof accommodationFormSchema>

// Composables
const { getAreasWithElements } = useAreaCatalogService()
const { saveAreasAndElements, handleApiError } = useAccommodationForm()
const form = useFormValidation(accommodationFormSchema, {
  status: 'active' as const,
})

// State
const areaCatalog = ref<AreaCatalog[]>([])
const selectedAreas = ref<SelectedArea[]>([])
const selectedElements = ref<SelectedElement[]>([])
const isDialogOpen = ref(false)
const isSubmitting = ref(false)

/**
 * Organiza elementos del catálogo por área en un Map
 */
const elementCatalogMap = computed((): Map<string, ElementCatalog[]> => {
  return buildElementCatalogMap()
})

/**
 * Valida si el formulario está completo
 */
const isFormValid = computed((): boolean => {
  return validateFormCompletion()
})

/**
 * Carga el catálogo maestro de áreas con elementos
 */
const loadAreaCatalog = async (): Promise<void> => {
  try {
    const areasWithElements = await getAreasWithElements()
    areaCatalog.value = areasWithElements as AreaCatalog[]
  } catch (error: unknown) {
    handleApiError(error, 'cargar catálogo de áreas')
  }
}

/**
 * Construye un Map de elementos organizados por área
 */
const buildElementCatalogMap = (): Map<string, ElementCatalog[]> => {
  const map = new Map<string, ElementCatalog[]>()

  areaCatalog.value.forEach((area) => {
    // CORRECCIÓN: Type guard para 'elements'
    if ('elements' in area && Array.isArray(area.elements)) {
      map.set(area.id, area.elements as ElementCatalog[])
    }
  })

  return map
}

/**
 * Valida que el formulario esté completo para habilitar submit
 */
const validateFormCompletion = (): boolean => {
  const hasBasicFields = Boolean(form.values.code && form.values.name)
  const hasAreas = selectedAreas.value.length > 0
  const hasElements = selectedElements.value.length > 0

  return hasBasicFields && hasAreas && hasElements
}

/**
 * Normaliza el código del alojamiento (uppercase, trim)
 */
const normalizeAccommodationCode = (code: string): string => {
  return code.trim().toUpperCase()
}

/**
 * Construye el JSONB de configured_areas para compatibilidad legacy
 */
const buildConfiguredAreasJsonb = (): Record<string, string[]> => {
  const configuredAreas: Record<string, string[]> = {}

  selectedAreas.value.forEach((area) => {
    const areaKey = buildAreaKey(area)

    configuredAreas[areaKey] = getElementNamesForArea(area)
  })

  return configuredAreas
}

/**
 * Construye la clave del área para el JSONB
 */
const buildAreaKey = (area: SelectedArea): string => {
  return area.room_number ? `${area.key}_${area.room_number}` : area.key
}

/**
 * Obtiene los nombres de elementos para un área específica
 */
const getElementNamesForArea = (area: SelectedArea): string[] => {
  return selectedElements.value
    .filter((element) => isElementFromArea(element, area))
    .map((element) => element.element_name)
}

/**
 * Verifica si un elemento pertenece a un área específica
 */
const isElementFromArea = (element: SelectedElement, area: SelectedArea): boolean => {
  const matchesArea = element.area_catalog_id === area.area_catalog_id
  const matchesRoomNumber =
    element.room_number === area.room_number || (!element.room_number && !area.room_number)

  return matchesArea && matchesRoomNumber
}

/**
 * Crea el alojamiento en la base de datos
 */
const createAccommodationInDatabase = async (values: AccommodationFormValues): Promise<string> => {
  const accommodationData = {
    code: normalizeAccommodationCode(values.code),
    name: values.name.trim(),
    address: values.address?.trim(),
    status: values.status,
    notes: values.notes?.trim(),
    configured_areas: buildConfiguredAreasJsonb(), // CORRECCIÓN: Campo requerido
  }

  const created = await accommodationService.create(accommodationData)
  return created.id
}

/**
 * Resetea el formulario a su estado inicial
 */
const resetFormState = (): void => {
  form.resetForm()
  selectedAreas.value = []
  selectedElements.value = []
}

/**
 * Maneja el submit del formulario
 */
const handleFormSubmit = async (values: Record<string, unknown>): Promise<void> => {
  // CORRECCIÓN: Type assertion segura
  const formValues = values as AccommodationFormValues

  isSubmitting.value = true

  try {
    const accommodationId = await createAccommodationInDatabase(formValues)

    await saveAreasAndElements(accommodationId, selectedAreas.value, selectedElements.value)

    toast.success('Alojamiento creado exitosamente')
    emit('accommodation-created')
    resetFormState()
    isDialogOpen.value = false
  } catch (error: unknown) {
    handleApiError(error, 'crear alojamiento')
  } finally {
    isSubmitting.value = false
  }
}

/**
 * Maneja el cambio del código para normalizarlo automáticamente
 */
const onCodeInput = (event: Event): void => {
  const input = event.target as HTMLInputElement
  const normalized = normalizeAccommodationCode(input.value)
  form.setFieldValue('code', normalized)
}

// Lifecycle
onMounted(async () => {
  await loadAreaCatalog()
})
</script>

<template>
  <Dialog v-model:open="isDialogOpen">
    <DialogTrigger as-child>
      <Button>Nuevo Alojamiento</Button>
    </DialogTrigger>

    <DialogContent class="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Crear Alojamiento</DialogTitle>
        <DialogDescription>
          Completa la información básica del alojamiento y configura sus áreas y elementos.
        </DialogDescription>
      </DialogHeader>

      <Form>
        <form class="space-y-6 py-4" @submit="form.handleSubmit(handleFormSubmit)">
          <!-- Información Básica -->
          <div class="space-y-4 border rounded-md p-4">
            <h3 class="text-sm font-medium">Información Básica</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Código -->
              <FormField v-slot="{ componentField }" name="code">
                <FormItem>
                  <FormLabel>Código *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: PISO-101"
                      v-bind="componentField"
                      @input="onCodeInput"
                    />
                  </FormControl>
                  <FormDescription> Identificador único (mayúsculas) </FormDescription>
                  <FormMessage />
                </FormItem>
              </FormField>

              <!-- Nombre -->
              <FormField v-slot="{ componentField }" name="name">
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Apartamento Centro" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>

            <!-- Dirección -->
            <FormField v-slot="{ componentField }" name="address">
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Calle Mayor 123, Madrid" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <!-- Estado -->
            <FormField v-slot="{ componentField }" name="status">
              <FormItem>
                <FormLabel>Estado *</FormLabel>
                <Select v-bind="componentField">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </FormField>

            <!-- Notas -->
            <FormField v-slot="{ componentField }" name="notes">
              <FormItem>
                <FormLabel>Notas</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Observaciones adicionales..."
                    rows="3"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>

          <!-- Configuración de Áreas -->
          <div class="space-y-4 border rounded-md p-4">
            <h3 class="text-sm font-medium">Configuración de Áreas</h3>
            <AreaSelector v-model="selectedAreas" :options="areaCatalog" />
          </div>

          <!-- Configuración de Elementos -->
          <div class="space-y-4 border rounded-md p-4">
            <h3 class="text-sm font-medium">Configuración de Elementos</h3>
            <AreaElementsConfig
              v-model="selectedElements"
              :element-catalog="elementCatalogMap"
              :selected-areas="selectedAreas"
            />
          </div>

          <!-- Footer con botones -->
          <DialogFooter class="gap-2">
            <Button type="button" variant="outline" @click="isDialogOpen = false">
              Cancelar
            </Button>
            <Button :disabled="!isFormValid || isSubmitting" type="submit">
              <Spinner v-if="isSubmitting" class="h-4 w-4 mr-2" />
              {{ isSubmitting ? 'Creando...' : 'Crear Alojamiento' }}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  </Dialog>
</template>
