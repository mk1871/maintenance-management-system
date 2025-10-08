<script lang="ts" setup>
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'
import { useRouter } from 'vue-router'

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

import AccommodationBasicInfo from './AccommodationBasicInfo.vue'
import AreaSelector from './AreaSelector.vue'
import AreaElementsConfig, { type AreaConfig } from './AreaElementsConfig.vue'

import {
  accommodationService,
  type CreateAccommodationData,
} from '@/composables/accommodationService'

// Emits
const emit = defineEmits<{
  'accommodation-created': []
}>()

const router = useRouter()

// Constantes
const AREA_OPTIONS = [
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
const basicInfo = ref({
  code: '',
  name: '',
  address: '',
  status: 'active' as 'active' | 'inactive',
})

const basicInfoErrors = ref({
  code: '',
  name: '',
})

const selectedAreaKeys = ref<string[]>([])
const areaConfigs = ref<AreaConfig[]>([])
const isSubmitting = ref(false)
const isDialogOpen = ref(false)

/**
 * Sincroniza las áreas seleccionadas con la configuración
 */
const syncAreaConfigs = (areaKeys: string[]): void => {
  // Crear configs para nuevas áreas
  areaKeys.forEach((key) => {
    if (!areaConfigs.value.some((config) => config.key === key)) {
      const label = AREA_OPTIONS.find((opt) => opt.value === key)?.label || key
      areaConfigs.value.push({
        key,
        label,
        elements: [],
      })
    }
  })

  // Remover configs de áreas deseleccionadas
  areaConfigs.value = areaConfigs.value.filter((config) => areaKeys.includes(config.key))
}

/**
 * Maneja el cambio de áreas seleccionadas
 */
const handleAreaChange = (newAreaKeys: string[]): void => {
  selectedAreaKeys.value = newAreaKeys
  syncAreaConfigs(newAreaKeys)
}

/**
 * Verifica si todas las áreas tienen al menos un elemento
 */
const allAreasHaveElements = computed(() => {
  return areaConfigs.value.every((config) => config.elements.length > 0)
})

/**
 * Verifica si el formulario es válido
 */
const isFormValid = computed(() => {
  return (
    !basicInfoErrors.value.code &&
    !basicInfoErrors.value.name &&
    basicInfo.value.code.length >= 2 &&
    basicInfo.value.name.length >= 3 &&
    selectedAreaKeys.value.length > 0 &&
    allAreasHaveElements.value
  )
})

/**
 * Convierte las configuraciones de áreas al formato de base de datos
 */
const buildConfiguredAreas = (): Record<string, string[]> => {
  return Object.fromEntries(
    areaConfigs.value.map((config) => [config.key, config.elements])
  )
}

/**
 * Resetea el formulario
 */
const resetForm = (): void => {
  basicInfo.value = {
    code: '',
    name: '',
    address: '',
    status: 'active',
  }
  basicInfoErrors.value = {
    code: '',
    name: '',
  }
  selectedAreaKeys.value = []
  areaConfigs.value = []
}

/**
 * Maneja la creación del alojamiento
 */
const handleCreate = async (): Promise<void> => {
  if (!isFormValid.value) {
    if (selectedAreaKeys.value.length === 0) {
      toast.error('Debes seleccionar al menos un área')
    } else if (!allAreasHaveElements.value) {
      toast.error('Todas las áreas deben tener al menos un elemento')
    } else {
      toast.error('Por favor, completa todos los campos requeridos')
    }
    return
  }

  isSubmitting.value = true

  const accommodationData: CreateAccommodationData = {
    code: basicInfo.value.code.trim().toUpperCase(),
    name: basicInfo.value.name.trim(),
    address: basicInfo.value.address.trim(),
    status: basicInfo.value.status,
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
    <DialogContent class="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Crear Alojamiento</DialogTitle>
        <DialogDescription>
          Completa la información del nuevo alojamiento. Los campos marcados son obligatorios.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-6 py-4">
        <!-- Información Básica -->
        <AccommodationBasicInfo
          v-model="basicInfo"
          v-model:errors="basicInfoErrors"
        />

        <!-- Selector de Áreas -->
        <AreaSelector
          :model-value="selectedAreaKeys"
          :options="AREA_OPTIONS"
          @update:model-value="handleAreaChange"
        />

        <!-- Configuración de Elementos -->
        <AreaElementsConfig
          :areas="areaConfigs"
          @update:areas="(newConfigs) => (areaConfigs = newConfigs)"
        />
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
