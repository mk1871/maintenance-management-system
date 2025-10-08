<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-vue-next'
import type { ElementCatalog } from '@/composables/areaCatalogService'
import type { SelectedArea } from './AreaSelector.vue'

// Props
const props = defineProps<{
  selectedAreas: SelectedArea[]
  elementCatalog: Map<string, ElementCatalog[]> // Map de area_catalog_id -> elementos
  modelValue: SelectedElement[]
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: SelectedElement[]]
}>()

// Interface para elementos seleccionados
export interface SelectedElement {
  accommodation_area_id: string // Se llenará al guardar
  area_catalog_id: string
  element_catalog_id: string
  element_name: string
  room_number?: number // Para identificar qué habitación
}

const selectedElements = ref<SelectedElement[]>([...props.modelValue])

/**
 * Sincroniza cambios con el componente padre
 */
watch(
  selectedElements,
  (newValue) => {
    emit('update:modelValue', newValue)
  },
  { deep: true }
)

/**
 * Verifica si un elemento está seleccionado para un área específica
 */
const isElementSelected = (
  areaCatalogId: string,
  elementCatalogId: string,
  roomNumber?: number
): boolean => {
  return selectedElements.value.some(
    (selected) =>
      selected.area_catalog_id === areaCatalogId &&
      selected.element_catalog_id === elementCatalogId &&
      (selected.room_number === roomNumber || (!selected.room_number && !roomNumber))
  )
}

/**
 * Obtiene elementos seleccionados para un área específica
 */
const getSelectedElementsForArea = (
  areaCatalogId: string,
  roomNumber?: number
): SelectedElement[] => {
  return selectedElements.value.filter(
    (selected) =>
      selected.area_catalog_id === areaCatalogId &&
      (selected.room_number === roomNumber || (!selected.room_number && !roomNumber))
  )
}

/**
 * Cuenta elementos seleccionados por área
 */
const countElementsForArea = (areaCatalogId: string, roomNumber?: number): number => {
  return getSelectedElementsForArea(areaCatalogId, roomNumber).length
}

/**
 * Maneja el toggle de un elemento en un área
 */
const handleElementToggle = (
  area: SelectedArea,
  element: ElementCatalog,
  checked: boolean
): void => {
  if (checked) {
    addElementToSelection(area, element)
  } else {
    removeElementFromSelection(area.area_catalog_id, element.id, area.room_number)
  }
}

/**
 * Agrega un elemento a la selección
 */
const addElementToSelection = (area: SelectedArea, element: ElementCatalog): void => {
  if (isElementSelected(area.area_catalog_id, element.id, area.room_number)) {
    return
  }

  selectedElements.value.push({
    accommodation_area_id: '', // Se llenará al guardar en DB
    area_catalog_id: area.area_catalog_id,
    element_catalog_id: element.id,
    element_name: element.name,
    room_number: area.room_number,
  })
}

/**
 * Elimina un elemento de la selección
 */
const removeElementFromSelection = (
  areaCatalogId: string,
  elementCatalogId: string,
  roomNumber?: number
): void => {
  selectedElements.value = selectedElements.value.filter(
    (selected) =>
      !(
        selected.area_catalog_id === areaCatalogId &&
        selected.element_catalog_id === elementCatalogId &&
        (selected.room_number === roomNumber || (!selected.room_number && !roomNumber))
      )
  )
}

/**
 * Obtiene elementos del catálogo para un área específica
 */
const getElementsForArea = (areaCatalogId: string): ElementCatalog[] => {
  return props.elementCatalog.get(areaCatalogId) || []
}

/**
 * Maneja el evento de cambio en checkbox de elemento
 */
const onElementCheckboxChange = (
  area: SelectedArea,
  element: ElementCatalog,
  event: Event
): void => {
  const checkbox = event.target as HTMLInputElement
  handleElementToggle(area, element, checkbox.checked)
}

/**
 * Verifica si hay áreas seleccionadas
 */
const hasSelectedAreas = computed((): boolean => {
  return props.selectedAreas.length > 0
})
</script>

<template>
  <div v-if="hasSelectedAreas" class="space-y-4">
    <div class="flex items-center justify-between">
      <Label>Configurar Elementos por Área *</Label>
      <p class="text-xs text-muted-foreground">
        Selecciona los elementos disponibles en cada área
      </p>
    </div>

    <div class="space-y-6 border rounded-md p-4 max-h-[500px] overflow-y-auto">
      <div
        v-for="area in selectedAreas"
        :key="`${area.area_catalog_id}-${area.room_number || 0}`"
        class="space-y-3 pb-6 border-b last:border-b-0 last:pb-0"
      >
        <!-- Header del área -->
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-medium">
            {{ area.label }}
            <span class="text-xs text-muted-foreground ml-2">
              ({{ countElementsForArea(area.area_catalog_id, area.room_number) }} elemento{{
                countElementsForArea(area.area_catalog_id, area.room_number) !== 1 ? 's' : ''
              }})
            </span>
          </h4>
        </div>

        <!-- Elementos seleccionados (chips) -->
        <div
          v-if="countElementsForArea(area.area_catalog_id, area.room_number) > 0"
          class="flex flex-wrap gap-2"
        >
          <Badge
            v-for="selectedElement in getSelectedElementsForArea(
              area.area_catalog_id,
              area.room_number
            )"
            :key="selectedElement.element_catalog_id"
            class="flex items-center gap-1.5 pr-1"
            variant="secondary"
          >
            <span>{{ selectedElement.element_name }}</span>
            <Button
              :aria-label="`Eliminar ${selectedElement.element_name}`"
              class="h-4 w-4 p-0 hover:bg-transparent hover:text-destructive"
              size="icon"
              variant="ghost"
              @click="
                removeElementFromSelection(
                  area.area_catalog_id,
                  selectedElement.element_catalog_id,
                  area.room_number
                )
              "
            >
              <X class="h-3 w-3" />
            </Button>
          </Badge>
        </div>

        <!-- Mensaje si no hay elementos seleccionados -->
        <p
          v-else
          class="text-sm text-muted-foreground italic bg-muted/50 p-2 rounded border border-dashed"
        >
          No hay elementos seleccionados para esta área
        </p>

        <!-- Catálogo de elementos disponibles -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
          <div
            v-for="element in getElementsForArea(area.area_catalog_id)"
            :key="element.id"
            class="flex items-center space-x-2"
          >
            <input
              :id="`element-${area.area_catalog_id}-${area.room_number || 0}-${element.id}`"
              :checked="isElementSelected(area.area_catalog_id, element.id, area.room_number)"
              class="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 cursor-pointer"
              type="checkbox"
              @change="(event) => onElementCheckboxChange(area, element, event)"
            />
            <Label
              :for="`element-${area.area_catalog_id}-${area.room_number || 0}-${element.id}`"
              class="cursor-pointer text-xs font-normal"
            >
              {{ element.name }}
            </Label>
          </div>
        </div>
      </div>
    </div>

    <div class="text-xs text-muted-foreground">
      Total elementos seleccionados: {{ selectedElements.length }}
    </div>
  </div>

  <!-- Mensaje cuando no hay áreas seleccionadas -->
  <div v-else class="border border-dashed rounded-md p-6 text-center">
    <p class="text-sm text-muted-foreground">
      Selecciona primero las áreas del alojamiento para configurar sus elementos
    </p>
  </div>
</template>
