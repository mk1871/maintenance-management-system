<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useForm } from 'vee-validate'
import { toast } from 'vue-sonner'
import { Plus } from 'lucide-vue-next'

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

import AccommodationBasicFields from '@/components/accommodations/AccommodationBasicFields.vue'
import AccommodationAreasConfig from '@/components/accommodations/AccommodationAreasConfig.vue'
import type { SelectedArea } from '@/components/accommodations/AreaSelector.vue'
import type { SelectedElement } from '@/components/accommodations/AreaElementsConfig.vue'

import { useAccommodationsStore } from '@/stores/accommodations'
import { useAreaCatalogStore } from '@/stores/areaCatalog'
import { useAccommodationForm } from '@/composables/useAccommodationForm'
import {
  accommodationValidationSchema,
  accommodationFullValidationSchema,
  type AccommodationBasicFormValues,
} from '@/schemas/accommodationSchema'

const emit = defineEmits<{
  (e: 'accommodation-created'): void
}>()

const accommodationsStore = useAccommodationsStore()
const areaCatalogStore = useAreaCatalogStore()
const { saveAreasAndElements, handleApiError } = useAccommodationForm()

const selectedAreas = ref<SelectedArea[]>([])
const selectedElements = ref<SelectedElement[]>([])
const isDialogOpen = ref(false)
const isSubmitting = ref(false)
const isFormValid = computed(() => form.meta.value.valid)

const elementCatalogMap = computed(() => areaCatalogStore.elementsByArea)

/**
 * Configuración del formulario con vee-validate + Zod (solo campos básicos)
 */
const form = useForm<AccommodationBasicFormValues>({
  validationSchema: accommodationValidationSchema,
  initialValues: {
    code: '',
    name: '',
    address: '',
    status: 'active',
    notes: '',
  },
})

/**
 * Resetea el formulario a valores iniciales
 */
const resetForm = (): void => {
  form.resetForm()
  selectedAreas.value = []
  selectedElements.value = []
}

/**
 * Validación completa con Zod (campos básicos + áreas + elementos)
 */
const validateFullForm = async (values: AccommodationBasicFormValues): Promise<boolean> => {
  const fullData = {
    ...values,
    selectedAreas: selectedAreas.value,
    selectedElements: selectedElements.value,
  }

  const result = accommodationFullValidationSchema.safeParse(fullData)

  if (!result.success) {
    // ✅ Fail Fast: Validar que exista al menos un error
    const firstError = result.error.issues[0]

    if (!firstError) {
      // Caso extremo: error sin issues (no debería pasar)
      toast.error('Error de validación desconocido')
      return false
    }

    toast.error(firstError.message)
    return false
  }

  return true
}

/**
 * Maneja el submit del formulario con validación robusta
 */
const onSubmit = form.handleSubmit(async (values: AccommodationBasicFormValues) => {
  // Validación completa (incluye áreas/elementos)
  const isValid = await validateFullForm(values)
  if (!isValid) return

  try {
    isSubmitting.value = true

    // Crear alojamiento usando el store
    const accommodation = await accommodationsStore.createAccommodation({
      code: values.code,
      name: values.name,
      address: values.address || undefined,
      status: values.status,
      notes: values.notes || undefined,
    })

    // Guardar áreas y elementos (siempre hay al menos 1 por validación)
    await saveAreasAndElements(accommodation.id, selectedAreas.value, selectedElements.value)

    toast.success('Alojamiento creado exitosamente')
    emit('accommodation-created')
    resetForm()
    isDialogOpen.value = false
  } catch (error: unknown) {
    handleApiError(error, 'crear alojamiento')
  } finally {
    isSubmitting.value = false
  }
})

onMounted(async () => {
  await areaCatalogStore.fetchAreas()
})
</script>

<template>
  <Dialog v-model:open="isDialogOpen">
    <DialogTrigger as-child>
      <Button>
        <Plus class="mr-2 h-4 w-4" />
        Nuevo Alojamiento
      </Button>
    </DialogTrigger>

    <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Crear Nuevo Alojamiento</DialogTitle>
        <DialogDescription>
          Completa los datos del nuevo alojamiento y configura sus áreas
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-6" @submit="onSubmit">
        <!-- Campos Básicos con validación automática -->
        <AccommodationBasicFields />

        <!-- Configuración de Áreas (validación en submit) -->
        <AccommodationAreasConfig
          v-model:selected-areas="selectedAreas"
          v-model:selected-elements="selectedElements"
          :area-catalog="areaCatalogStore.areas"
          :element-catalog-map="elementCatalogMap"
        />

        <DialogFooter>
          <Button type="button" variant="outline" @click="isDialogOpen = false"> Cancelar </Button>

          <!-- Deshabilitar hasta que el formulario sea válido -->
          <Button :disabled="isSubmitting || !isFormValid" type="submit">
            <Spinner v-if="isSubmitting" class="mr-2 h-4 w-4" />
            {{ isSubmitting ? 'Creando...' : 'Crear Alojamiento' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
