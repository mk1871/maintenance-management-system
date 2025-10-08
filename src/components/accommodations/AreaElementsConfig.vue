<script lang="ts" setup>
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import CustomCheckbox from '@/components/ui/CustomCheckbox.vue'
import { X, CheckSquare } from 'lucide-vue-next'
import type { ElementCatalog } from '@/composables/areaCatalogService'
import type { SelectedArea } from './AreaSelector.vue'

const props = defineProps<{
  selectedAreas: SelectedArea[]
  elementCatalog: Map<string, ElementCatalog[]>
  modelValue: SelectedElement[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SelectedElement[]]
}>()

export interface SelectedElement {
  accommodation_area_id: string
  area_catalog_id: string
  element_catalog_id: string
  element_name: string
  room_number?: number
}

const isElementSelected = (
  areaCatalogId: string,
  elementCatalogId: string,
  roomNumber?: number,
): boolean => {
  return props.modelValue.some(
    (selected) =>
      selected.area_catalog_id === areaCatalogId &&
      selected.element_catalog_id === elementCatalogId &&
      (selected.room_number === roomNumber || (!selected.room_number && !roomNumber)),
  )
}

const getSelectedElementsForArea = (
  areaCatalogId: string,
  roomNumber?: number,
): SelectedElement[] => {
  return props.modelValue.filter(
    (selected) =>
      selected.area_catalog_id === areaCatalogId &&
      (selected.room_number === roomNumber || (!selected.room_number && !roomNumber)),
  )
}

const countElementsForArea = (areaCatalogId: string, roomNumber?: number): number => {
  return getSelectedElementsForArea(areaCatalogId, roomNumber).length
}

const getElementsForArea = (areaCatalogId: string): ElementCatalog[] => {
  return props.elementCatalog.get(areaCatalogId) || []
}

const handleElementCheckboxChange = (
  area: SelectedArea,
  element: ElementCatalog,
  checked: boolean,
): void => {
  const newElements = [...props.modelValue]

  if (checked) {
    if (!isElementSelected(area.area_catalog_id, element.id, area.room_number)) {
      newElements.push({
        accommodation_area_id: '',
        area_catalog_id: area.area_catalog_id,
        element_catalog_id: element.id,
        element_name: element.name,
        room_number: area.room_number,
      })
    }
    emit('update:modelValue', newElements)
  } else {
    const filtered = newElements.filter(
      (selected) =>
        !(
          selected.area_catalog_id === area.area_catalog_id &&
          selected.element_catalog_id === element.id &&
          (selected.room_number === area.room_number || (!selected.room_number && !area.room_number))
        ),
    )
    emit('update:modelValue', filtered)
  }
}

// ✅ NUEVO: Seleccionar todos los elementos de un área
const selectAllElementsForArea = (area: SelectedArea): void => {
  const elementsForArea = getElementsForArea(area.area_catalog_id)
  const newElements = [...props.modelValue]

  elementsForArea.forEach((element) => {
    if (!isElementSelected(area.area_catalog_id, element.id, area.room_number)) {
      newElements.push({
        accommodation_area_id: '',
        area_catalog_id: area.area_catalog_id,
        element_catalog_id: element.id,
        element_name: element.name,
        room_number: area.room_number,
      })
    }
  })

  emit('update:modelValue', newElements)
}

const removeElement = (
  areaCatalogId: string,
  elementCatalogId: string,
  roomNumber?: number,
): void => {
  const filtered = props.modelValue.filter(
    (selected) =>
      !(
        selected.area_catalog_id === areaCatalogId &&
        selected.element_catalog_id === elementCatalogId &&
        (selected.room_number === roomNumber || (!selected.room_number && !roomNumber))
      ),
  )
  emit('update:modelValue', filtered)
}
</script>

<template>
  <div v-if="selectedAreas.length > 0" class="space-y-4">
    <div class="flex flex-col gap-1">
      <Label>Configurar Elementos por Área *</Label>
      <p class="text-sm text-muted-foreground">
        Selecciona los elementos disponibles en cada área
      </p>
    </div>

    <div class="space-y-6 border rounded-md p-4 max-h-[500px] overflow-y-auto">
      <div
        v-for="area in selectedAreas"
        :key="`${area.area_catalog_id}-${area.room_number || 0}`"
        class="space-y-3 pb-6 border-b last:border-b-0 last:pb-0"
      >
        <!-- Header con botón Seleccionar Todo -->
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-medium">
            {{ area.label }}
            <span class="text-xs text-muted-foreground ml-2">
              ({{ countElementsForArea(area.area_catalog_id, area.room_number) }} elemento{{
                countElementsForArea(area.area_catalog_id, area.room_number) !== 1 ? 's' : ''
              }})
            </span>
          </h4>

          <!-- Botón Seleccionar Todo (si hay más de 3 elementos) -->
          <Button
            v-if="getElementsForArea(area.area_catalog_id).length > 3"
            size="sm"
            type="button"
            variant="outline"
            @click="selectAllElementsForArea(area)"
          >
            <CheckSquare class="mr-2 h-4 w-4" />
            Seleccionar todo
          </Button>
        </div>

        <!-- Elementos seleccionados (badges) -->
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
              class="h-4 w-4 p-0 hover:bg-transparent hover:text-destructive"
              size="icon"
              variant="ghost"
              @click="
                removeElement(
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

        <p
          v-else
          class="text-sm text-muted-foreground italic bg-muted/50 p-2 rounded border border-dashed"
        >
          No hay elementos seleccionados para esta área
        </p>

        <!-- Grid de checkboxes -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
          <div
            v-for="element in getElementsForArea(area.area_catalog_id)"
            :key="element.id"
            class="flex items-center space-x-2"
          >
            <CustomCheckbox
              :id="`element-${area.area_catalog_id}-${area.room_number || 0}-${element.id}`"
              :checked="isElementSelected(area.area_catalog_id, element.id, area.room_number)"
              @update:checked="(checked) => handleElementCheckboxChange(area, element, checked)"
            />
            <Label
              :for="`element-${area.area_catalog_id}-${area.room_number || 0}-${element.id}`"
              class="cursor-pointer text-xs font-normal leading-none"
            >
              {{ element.name }}
            </Label>
          </div>
        </div>
      </div>
    </div>

    <div class="text-xs text-muted-foreground">
      Total elementos seleccionados: {{ modelValue.length }}
    </div>
  </div>

  <div v-else class="border border-dashed rounded-md p-6 text-center">
    <p class="text-sm text-muted-foreground">
      Selecciona primero las áreas del alojamiento para configurar sus elementos
    </p>
  </div>
</template>
