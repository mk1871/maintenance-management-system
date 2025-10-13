<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
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

const emit = defineEmits<{
  (e: 'accommodation-created'): void
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
const areaCatalogStore = useAreaCatalogStore()
const { saveAreasAndElements, handleApiError } = useAccommodationForm()

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

const selectedAreas = ref<SelectedArea[]>([])
const selectedElements = ref<SelectedElement[]>([])
const isDialogOpen = ref(false)
const isSubmitting = ref(false)

const elementCatalogMap = computed(() => areaCatalogStore.elementsByArea)

const validateForm = (): boolean => {
  errors.value = { code: '', name: '' }
  let isValid = true

  // Validar código
  if (!formData.value.code.trim()) {
    errors.value.code = 'El código es requerido'
    isValid = false
  } else if (formData.value.code.length < MIN_CODE_LENGTH || formData.value.code.length > MAX_CODE_LENGTH) {
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

const resetForm = (): void => {
  formData.value = {
    code: '',
    name: '',
    address: '',
    status: 'active',
    notes: '',
  }
  errors.value = { code: '', name: '' }
  selectedAreas.value = []
  selectedElements.value = []
}

const handleSubmit = async (): Promise<void> => {
  if (!validateForm()) {
    toast.error('Por favor corrige los errores del formulario')
    return
  }

  try {
    isSubmitting.value = true

    // Crear alojamiento usando el store
    const accommodation = await accommodationsStore.createAccommodation({
      code: formData.value.code.toUpperCase(),
      name: formData.value.name,
      address: formData.value.address || undefined,
      status: formData.value.status,
      notes: formData.value.notes || undefined,
    })

    // Guardar áreas y elementos
    if (selectedAreas.value.length > 0) {
      await saveAreasAndElements(accommodation.id, selectedAreas.value, selectedElements.value)
    }

    emit('accommodation-created')
    resetForm()
    isDialogOpen.value = false
  } catch (error: unknown) {
    handleApiError(error)
  } finally {
    isSubmitting.value = false
  }
}

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

      <div class="space-y-6">
        <!-- Campos Básicos -->
        <AccommodationBasicFields
          :errors="errors"
          :form-data="formData"
          @update:code="(val) => (formData.code = val)"
          @update:name="(val) => (formData.name = val)"
          @update:address="(val) => (formData.address = val)"
          @update:status="(val) => (formData.status = val)"
          @update:notes="(val) => (formData.notes = val)"
        />

        <!-- Configuración de Áreas -->
        <AccommodationAreasConfig
          v-model:selected-areas="selectedAreas"
          v-model:selected-elements="selectedElements"
          :area-catalog="areaCatalogStore.areas"
          :element-catalog-map="elementCatalogMap"
        />
      </div>

      <DialogFooter>
        <Button variant="outline" @click="isDialogOpen = false">
          Cancelar
        </Button>
        <Button :disabled="isSubmitting" @click="handleSubmit">
          <Spinner v-if="isSubmitting" class="mr-2 h-4 w-4" />
          {{ isSubmitting ? 'Creando...' : 'Crear Alojamiento' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
