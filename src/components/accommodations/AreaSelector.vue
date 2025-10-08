<script lang="ts" setup>
import { ref, computed } from 'vue'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { FormDescription } from '@/components/ui/form'
import type { AreaCatalog } from '@/composables/areaCatalogService'

// Props
const props = defineProps<{
  options: AreaCatalog[]
  modelValue: SelectedArea[]
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: SelectedArea[]]
}>()

// Interface exportada
export interface SelectedArea {
  area_catalog_id: string
  key: string
  label: string
  room_number?: number
  custom_label?: string
}

// State local
const selectedAreas = ref<SelectedArea[]>([...props.modelValue])

/**
 * Cuenta cuántas habitaciones están seleccionadas
 */
const bedroomCount = computed((): number => {
  return countSelectedBedrooms()
})

/**
 * Obtiene el área de habitaciones del catálogo
 */
const bedroomArea = computed((): AreaCatalog | undefined => {
  return findBedroomInCatalog()
})

/**
 * Obtiene áreas que no son habitaciones
 */
const nonBedroomAreas = computed((): AreaCatalog[] => {
  return filterNonBedroomAreas()
})

/**
 * Verifica si un área está seleccionada
 */
const isAreaSelected = (areaCatalogId: string): boolean => {
  return selectedAreas.value.some((area) => area.area_catalog_id === areaCatalogId)
}

/**
 * Cuenta las habitaciones seleccionadas
 */
const countSelectedBedrooms = (): number => {
  return selectedAreas.value.filter((area) => area.key === 'bedroom').length
}

/**
 * Encuentra el área de habitaciones en el catálogo
 */
const findBedroomInCatalog = (): AreaCatalog | undefined => {
  return props.options.find((option) => option.key === 'bedroom')
}

/**
 * Filtra áreas que no son habitaciones
 */
const filterNonBedroomAreas = (): AreaCatalog[] => {
  return props.options.filter((option) => option.key !== 'bedroom')
}

/**
 * Agrega un área a la selección
 */
const addAreaToSelection = (area: AreaCatalog): void => {
  if (isAreaSelected(area.id)) return

  selectedAreas.value.push({
    area_catalog_id: area.id,
    key: area.key,
    label: area.label,
  })

  emitUpdate()
}

/**
 * Elimina un área de la selección
 */
const removeAreaFromSelection = (areaCatalogId: string): void => {
  selectedAreas.value = selectedAreas.value.filter(
    (selected) => selected.area_catalog_id !== areaCatalogId,
  )

  emitUpdate()
}

/**
 * Maneja el cambio de estado del checkbox de área
 */
const handleAreaCheckboxChange = (area: AreaCatalog, checked: boolean): void => {
  if (area.key === 'bedroom') return

  if (checked) {
    addAreaToSelection(area)
  } else {
    removeAreaFromSelection(area.id)
  }
}

/**
 * Handler específico para el evento update:checked del Checkbox
 */
const onAreaCheckboxUpdate = (area: AreaCatalog) => {
  return (checked: boolean | 'indeterminate'): void => {
    // Ignorar estado indeterminate
    if (checked === 'indeterminate') return

    handleAreaCheckboxChange(area, checked)
  }
}

/**
 * Elimina todas las habitaciones de la selección
 */
const removeAllBedrooms = (): void => {
  selectedAreas.value = selectedAreas.value.filter((selected) => selected.key !== 'bedroom')
}

/**
 * Agrega habitaciones numeradas a la selección
 */
const addBedroomsToSelection = (area: AreaCatalog, count: number): void => {
  for (let roomNumber = 1; roomNumber <= count; roomNumber++) {
    selectedAreas.value.push({
      area_catalog_id: area.id,
      key: area.key,
      label: `${area.label} ${roomNumber}`,
      room_number: roomNumber,
    })
  }
}

/**
 * Limita el número de habitaciones entre 0 y 4
 */
const clampBedroomCount = (count: number): number => {
  const MIN_BEDROOMS = 0
  const MAX_BEDROOMS = 4
  return Math.max(MIN_BEDROOMS, Math.min(MAX_BEDROOMS, count))
}

/**
 * Maneja el cambio en el número de habitaciones
 */
const handleBedroomCountChange = (count: number): void => {
  if (!bedroomArea.value) return

  const validCount = clampBedroomCount(count)

  removeAllBedrooms()
  addBedroomsToSelection(bedroomArea.value, validCount)
  emitUpdate()
}

/**
 * Extrae el valor numérico del input de habitaciones
 */
const extractBedroomCountFromInput = (event: Event): number => {
  const input = event.target as HTMLInputElement
  return parseInt(input.value) || 0
}

/**
 * Maneja el evento de input en el campo de habitaciones
 */
const onBedroomInputChange = (event: Event): void => {
  const count = extractBedroomCountFromInput(event)
  handleBedroomCountChange(count)
}

/**
 * Emite el evento de actualización al padre
 */
const emitUpdate = (): void => {
  emit('update:modelValue', selectedAreas.value)
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <Label>Áreas del Alojamiento *</Label>
      <FormDescription> Selecciona las áreas que tiene este alojamiento </FormDescription>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded-md p-4">
      <!-- Áreas normales con Checkbox de shadcn-vue -->
      <div v-for="option in nonBedroomAreas" :key="option.id" class="flex items-center space-x-2">
        <Checkbox
          :id="`area-${option.key}`"
          :checked="isAreaSelected(option.id)"
          @update:checked="onAreaCheckboxUpdate(option)"
        />
        <Label
          :for="`area-${option.key}`"
          class="cursor-pointer text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {{ option.label }}
        </Label>
      </div>

      <!-- Habitaciones: Input numérico de shadcn-vue -->
      <div v-if="bedroomArea" class="col-span-full border-t pt-3 mt-2">
        <div class="flex items-center gap-4">
          <Label :for="`bedroom-count`" class="text-sm font-normal whitespace-nowrap">
            Número de Habitaciones (máx. 4):
          </Label>
          <Input
            id="bedroom-count"
            :model-value="bedroomCount"
            class="w-20"
            max="4"
            min="0"
            type="number"
            @input="onBedroomInputChange"
          />
        </div>
        <FormDescription v-if="bedroomCount > 0" class="mt-2">
          Se crearán: {{ bedroomCount }} habitación{{ bedroomCount !== 1 ? 'es' : '' }} numerada{{
            bedroomCount !== 1 ? 's' : ''
          }}
        </FormDescription>
      </div>
    </div>

    <div class="flex justify-between text-xs text-muted-foreground">
      <span>Áreas totales: {{ selectedAreas.length }}</span>
      <span v-if="bedroomCount > 0">Habitaciones: {{ bedroomCount }}</span>
    </div>
  </div>
</template>
