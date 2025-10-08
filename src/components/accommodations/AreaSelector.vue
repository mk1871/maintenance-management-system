<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
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

// Interface para áreas seleccionadas
export interface SelectedArea {
  area_catalog_id: string
  key: string
  label: string
  room_number?: number
  custom_label?: string
}

const selectedAreas = ref<SelectedArea[]>([...props.modelValue])

/**
 * Sincroniza cambios con el componente padre
 */
watch(
  selectedAreas,
  (newValue) => {
    emit('update:modelValue', newValue)
  },
  { deep: true }
)

/**
 * Verifica si un área está seleccionada
 */
const isSelected = (areaCatalogId: string, roomNumber?: number): boolean => {
  return selectedAreas.value.some(
    (area) =>
      area.area_catalog_id === areaCatalogId &&
      (area.room_number === roomNumber || (!area.room_number && !roomNumber))
  )
}

/**
 * Cuenta cuántas habitaciones están seleccionadas
 */
const bedroomCount = computed((): number => {
  return selectedAreas.value.filter((area) => area.key === 'bedroom').length
})

/**
 * Obtiene el área de habitación del catálogo
 */
const bedroomArea = computed((): AreaCatalog | undefined => {
  return props.options.find((option) => option.key === 'bedroom')
})

/**
 * Obtiene áreas que no son habitaciones para renderizado
 */
const nonBedroomAreas = computed((): AreaCatalog[] => {
  return props.options.filter((option) => option.key !== 'bedroom')
})

/**
 * Maneja el toggle de un área normal (no habitaciones)
 */
const handleToggle = (area: AreaCatalog, checked: boolean): void => {
  if (area.key === 'bedroom') {
    return
  }

  if (checked) {
    addAreaToSelection(area)
  } else {
    removeAreaFromSelection(area.id)
  }
}

/**
 * Agrega un área a la selección si no existe
 */
const addAreaToSelection = (area: AreaCatalog): void => {
  if (!isSelected(area.id)) {
    selectedAreas.value.push({
      area_catalog_id: area.id,
      key: area.key,
      label: area.label,
    })
  }
}

/**
 * Elimina un área de la selección
 */
const removeAreaFromSelection = (areaCatalogId: string): void => {
  selectedAreas.value = selectedAreas.value.filter(
    (selected) => selected.area_catalog_id !== areaCatalogId
  )
}

/**
 * Maneja el cambio en el número de habitaciones (0-4)
 */
const handleBedroomChange = (area: AreaCatalog, count: number): void => {
  const validCount = clampBedroomCount(count)
  removeAllBedrooms()
  addBedroomsToSelection(area, validCount)
}

/**
 * Limita el número de habitaciones entre 0 y 4
 */
const clampBedroomCount = (count: number): number => {
  return Math.max(0, Math.min(4, count))
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
 * Extrae el valor numérico del input de habitaciones
 */
const extractBedroomCountFromInput = (event: Event): number => {
  const input = event.target as HTMLInputElement
  return parseInt(input.value) || 0
}

/**
 * Maneja el evento de cambio en el input de habitaciones
 */
const onBedroomInputChange = (event: Event): void => {
  if (!bedroomArea.value) {
    return
  }

  const count = extractBedroomCountFromInput(event)
  handleBedroomChange(bedroomArea.value, count)
}

/**
 * Maneja el evento de cambio en checkbox de área
 */
const onAreaCheckboxChange = (area: AreaCatalog, event: Event): void => {
  const checkbox = event.target as HTMLInputElement
  handleToggle(area, checkbox.checked)
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <Label>Áreas del Alojamiento *</Label>
      <p class="text-sm text-muted-foreground">
        Selecciona las áreas que tiene este alojamiento
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded-md p-4">
      <!-- Áreas normales (excepto habitaciones) -->
      <div
        v-for="option in nonBedroomAreas"
        :key="option.id"
        class="flex items-center space-x-2"
      >
        <input
          :id="`area-${option.key}`"
          :checked="isSelected(option.id)"
          class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 cursor-pointer"
          type="checkbox"
          @change="(event) => onAreaCheckboxChange(option, event)"
        />
        <Label :for="`area-${option.key}`" class="cursor-pointer text-sm font-normal">
          {{ option.label }}
        </Label>
      </div>

      <!-- Habitaciones: campo numérico (0-4) -->
      <div v-if="bedroomArea" class="col-span-full border-t pt-3 mt-2">
        <div class="flex items-center gap-4">
          <Label :for="`bedroom-count`" class="text-sm font-normal whitespace-nowrap">
            Número de Habitaciones (máx. 4):
          </Label>
          <Input
            id="bedroom-count"
            :value="bedroomCount"
            class="w-20"
            max="4"
            min="0"
            type="number"
            @input="onBedroomInputChange"
          />
        </div>
        <p v-if="bedroomCount > 0" class="text-xs text-muted-foreground mt-2">
          Se crearán: Habitación 1, Habitación 2, Habitación 3, Habitación 4 (según cantidad)
        </p>
      </div>
    </div>

    <div class="flex justify-between text-xs text-muted-foreground">
      <span>Áreas totales: {{ selectedAreas.length }}</span>
      <span v-if="bedroomCount > 0">Habitaciones: {{ bedroomCount }}</span>
    </div>
  </div>
</template>
