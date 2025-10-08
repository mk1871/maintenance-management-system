<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FormDescription } from '@/components/ui/form'
import { X } from 'lucide-vue-next'
import type { ElementCatalog } from '@/composables/areaCatalogService'
import type { SelectedArea } from './AreaSelector.vue'

// Props
const props = defineProps<{
  selectedAreas: SelectedArea[]
  elementCatalog: Map<string, ElementCatalog[]>
  modelValue: SelectedElement[]
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: SelectedElement[]]
}>()

// Interface exportada
export interface SelectedElement {
  accommodation_area_id: string
  area_catalog_id: string
  element_catalog_id: string
  element_name: string
  room_number?: number
}

// State local
const selectedElements = ref<SelectedElement[]>([...props.modelValue])

/**
 * Sincroniza cambios con el componente padre
 */
watch(
  selectedElements,
  () => {
    emitUpdate()
  },
  { deep: true },
)

/**
 * Verifica si hay áreas seleccionadas
 */
const hasSelectedAreas = computed((): boolean => {
  return props.selectedAreas.length > 0
})

/**
 * Verifica si un elemento está seleccionado para un área
 */
const isElementSelected = (
  areaCatalogId: string,
  elementCatalogId: string,
  roomNumber?: number,
): boolean => {
  return selectedElements.value.some(
    (selected) =>
      selected.area_catalog_id === areaCatalogId &&
      selected.element_catalog_id === elementCatalogId &&
      (selected.room_number === roomNumber || (!selected.room_number && !roomNumber)),
  )
}

/**
 * Obtiene elementos seleccionados para un área específica
 */
const getSelectedElementsForArea = (
  areaCatalogId: string,
  roomNumber?: number,
): SelectedElement[] => {
  return selectedElements.value.filter(
    (selected) =>
      selected.area_catalog_id === areaCatalogId &&
      (selected.room_number === roomNumber || (!selected.room_number && !roomNumber)),
  )
}

/**
 * Cuenta elementos seleccionados por área
 */
const countElementsForArea = (areaCatalogId: string, roomNumber?: number): number => {
  return getSelectedElementsForArea(areaCatalogId, roomNumber).length
}

/**
 * Obtiene elementos del catálogo para un área
 */
const getElementsForArea = (areaCatalogId: string): ElementCatalog[] => {
  return props.elementCatalog.get(areaCatalogId) || []
}

/**
 * Agrega un elemento a la selección
 */
const addElementToSelection = (area: SelectedArea, element: ElementCatalog): void => {
  if (isElementSelected(area.area_catalog_id, element.id, area.room_number)) {
    return
  }

  selectedElements.value.push({
    accommodation_area_id: '',
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
  roomNumber?: number,
): void => {
  selectedElements.value = selectedElements.value.filter(
    (selected) =>
      !(
        selected.area_catalog_id === areaCatalogId &&
        selected.element_catalog_id === elementCatalogId &&
        (selected.room_number === roomNumber || (!selected.room_number && !roomNumber))
      ),
  )
}

/**
 * Maneja el cambio de estado del checkbox de elemento (con tipo explícito)
 */
const handleElementCheckboxChange = (
  area: SelectedArea,
  element: ElementCatalog,
  checked: boolean,
): void => {
  if (checked) {
    addElementToSelection(area, element)
  } else {
    removeElementFromSelection(area.area_catalog_id, element.id, area.room_number)
  }
}

/**
 * Handler específico para el evento update:checked del Checkbox
 */
const onElementCheckboxUpdate = (area: SelectedArea, element: ElementCatalog) => {
  return (checked: boolean | 'indeterminate'): void => {
    // Ignorar estado indeterminate
    if (checked === 'indeterminate') return

    handleElementCheckboxChange(area, element, checked)
  }
}

/**
 * Construye el label para aria-label del botón eliminar
 */
const buildRemoveLabel = (elementName: string): string => {
  return `Eliminar ${elementName}`
}

/**
 * Construye el sufijo del contador de elementos
 */
const buildCounterSuffix = (count: number): string => {
  return count !== 1 ? 's' : ''
}

/**
 * Emite el evento de actualización al padre
 */
const emitUpdate = (): void => {
  emit('update:modelValue', selectedElements.value)
}
</script>

<template>
  <div v-if="hasSelectedAreas" class="space-y-4">
    <div class="flex items-center justify-between">
      <Label>Configurar Elementos por Área *</Label>
      <FormDescription> Selecciona los elementos disponibles en cada área </FormDescription>
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
                buildCounterSuffix(countElementsForArea(area.area_catalog_id, area.room_number))
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
              area.room_number,
            )"
            :key="selectedElement.element_catalog_id"
            class="flex items-center gap-1.5 pr-1"
            variant="secondary"
          >
            <span>{{ selectedElement.element_name }}</span>
            <Button
              :aria-label="buildRemoveLabel(selectedElement.element_name)"
              class="h-4 w-4 p-0 hover:bg-transparent hover:text-destructive"
              size="icon"
              variant="ghost"
              @click="
                removeElementFromSelection(
                  area.area_catalog_id,
                  selectedElement.element_catalog_id,
                  area.room_number,
                )
              "
            >
              <X class="h-3 w-3" />
            </Button>
          </Badge>
        </div>

        <!-- Mensaje si no hay elementos -->
        <p
          v-else
          class="text-sm text-muted-foreground italic bg-muted/50 p-2 rounded border border-dashed"
        >
          No hay elementos seleccionados para esta área
        </p>

        <!-- Catálogo de elementos con Checkbox de shadcn-vue -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
          <div
            v-for="element in getElementsForArea(area.area_catalog_id)"
            :key="element.id"
            class="flex items-center space-x-2"
          >
            <Checkbox
              :id="`element-${area.area_catalog_id}-${area.room_number || 0}-${element.id}`"
              :checked="isElementSelected(area.area_catalog_id, element.id, area.room_number)"
              @update:checked="onElementCheckboxUpdate(area, element)"
            />
            <Label
              :for="`element-${area.area_catalog_id}-${area.room_number || 0}-${element.id}`"
              class="cursor-pointer text-xs font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
    <FormDescription class="text-sm">
      Selecciona primero las áreas del alojamiento para configurar sus elementos
    </FormDescription>
  </div>
</template>
