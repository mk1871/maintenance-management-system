<script lang="ts" setup>
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import CustomCheckbox from '@/components/ui/CustomCheckbox.vue'
import type { AreaCatalog } from '@/composables/areaCatalogService'

const props = defineProps<{
  options: AreaCatalog[]
  modelValue: SelectedArea[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SelectedArea[]]
}>()

export interface SelectedArea {
  area_catalog_id: string
  key: string
  label: string
  room_number?: number
  custom_label?: string
}

const bedroomCount = (): number => {
  return props.modelValue.filter((area) => area.key === 'bedroom').length
}

const bedroomArea = (): AreaCatalog | undefined => {
  return props.options.find((option) => option.key === 'bedroom')
}

const nonBedroomAreas = (): AreaCatalog[] => {
  return props.options.filter((option) => option.key !== 'bedroom')
}

const isAreaSelected = (areaCatalogId: string): boolean => {
  return props.modelValue.some((area) => area.area_catalog_id === areaCatalogId)
}

const handleAreaCheckboxChange = (area: AreaCatalog, checked: boolean): void => {
  const newAreas = [...props.modelValue]

  if (checked) {
    if (!isAreaSelected(area.id)) {
      newAreas.push({
        area_catalog_id: area.id,
        key: area.key,
        label: area.label,
      })
    }
    emit('update:modelValue', newAreas)
  } else {
    const filtered = newAreas.filter((selected) => selected.area_catalog_id !== area.id)
    emit('update:modelValue', filtered)
  }
}

const handleBedroomCountChange = (count: number): void => {
  const bedroom = bedroomArea()
  if (!bedroom) return

  const validCount = Math.max(0, Math.min(4, count))
  const withoutBedrooms = props.modelValue.filter((area) => area.key !== 'bedroom')
  const newAreas = [...withoutBedrooms]

  for (let roomNumber = 1; roomNumber <= validCount; roomNumber++) {
    newAreas.push({
      area_catalog_id: bedroom.id,
      key: bedroom.key,
      label: `${bedroom.label} ${roomNumber}`,
      room_number: roomNumber,
    })
  }

  emit('update:modelValue', newAreas)
}

const onBedroomInputChange = (event: Event): void => {
  const input = event.target as HTMLInputElement
  const count = parseInt(input.value) || 0
  handleBedroomCountChange(count)
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <Label>Áreas del Alojamiento *</Label>
      <p class="text-sm text-muted-foreground mt-1">
        Selecciona las áreas que tiene este alojamiento
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded-md p-4">
      <div v-for="option in nonBedroomAreas()" :key="option.id" class="flex items-center space-x-2">
        <CustomCheckbox
          :id="`area-${option.key}`"
          :checked="isAreaSelected(option.id)"
          @update:checked="(checked) => handleAreaCheckboxChange(option, checked)"
        />
        <Label :for="`area-${option.key}`" class="cursor-pointer text-sm font-normal leading-none">
          {{ option.label }}
        </Label>
      </div>

      <div v-if="bedroomArea()" class="col-span-full border-t pt-3 mt-2">
        <div class="flex items-center gap-4">
          <Label class="text-sm font-normal whitespace-nowrap" for="bedroom-count">
            Número de Habitaciones (máx. 4):
          </Label>
          <Input
            id="bedroom-count"
            :model-value="bedroomCount()"
            class="w-20"
            max="4"
            min="0"
            type="number"
            @input="onBedroomInputChange"
          />
        </div>
        <p v-if="bedroomCount() > 0" class="text-sm text-muted-foreground mt-2">
          Se crearán: {{ bedroomCount() }} habitación{{
            bedroomCount() !== 1 ? 'es' : ''
          }}
          numerada{{ bedroomCount() !== 1 ? 's' : '' }}
        </p>
      </div>
    </div>

    <div class="flex justify-between text-xs text-muted-foreground">
      <span>Áreas totales: {{ modelValue.length }}</span>
      <span v-if="bedroomCount() > 0">Habitaciones: {{ bedroomCount() }}</span>
    </div>
  </div>
</template>
