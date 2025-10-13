<script lang="ts" setup>
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import type { Accommodation } from '@/composables/accommodationService'
import type {
  AccommodationArea,
  AccommodationElement,
} from '@/composables/accommodationAreaService'

defineProps<{
  accommodationId: string
  areaId: string
  elementId: string
  accommodations: Accommodation[]
  areas: AccommodationArea[]
  isLoadingAreas: boolean
  errors: {
    accommodation_id: string
    accommodation_area_id: string
    accommodation_element_id: string
  }
}>()

const emit = defineEmits<{
  (e: 'update:accommodationId', value: string): void
  (e: 'update:areaId', value: string): void
  (e: 'update:elementId', value: string): void
}>()

const selectedAreaElements = (
  areaId: string,
  areas: AccommodationArea[],
): AccommodationElement[] => {
  const area = areas.find((a) => a.id === areaId)
  return area?.elements || []
}

const handleAccommodationChange = (value: unknown): void => {
  if (value && typeof value === 'string') {
    emit('update:accommodationId', value)
  }
}

const handleAreaChange = (value: unknown): void => {
  if (value && typeof value === 'string') {
    emit('update:areaId', value)
  }
}

const handleElementChange = (value: unknown): void => {
  if (value && typeof value === 'string') {
    emit('update:elementId', value)
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Alojamiento -->
    <div class="space-y-2">
      <Label>Alojamiento *</Label>
      <Select :model-value="accommodationId" @update:model-value="handleAccommodationChange">
        <SelectTrigger :class="{ 'border-destructive': errors.accommodation_id }">
          <SelectValue placeholder="Selecciona un alojamiento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="acc in accommodations" :key="acc.id" :value="acc.id">
            {{ acc.code }} - {{ acc.name }}
          </SelectItem>
        </SelectContent>
      </Select>
      <p v-if="errors.accommodation_id" class="text-sm font-medium text-destructive">
        {{ errors.accommodation_id }}
      </p>
    </div>

    <!-- Área -->
    <div class="space-y-2">
      <Label>Área *</Label>
      <div v-if="isLoadingAreas" class="flex items-center gap-2 p-2">
        <Spinner class="h-4 w-4" />
        <span class="text-sm text-muted-foreground">Cargando áreas...</span>
      </div>
      <Select
        v-else
        :disabled="!accommodationId || areas.length === 0"
        :model-value="areaId"
        @update:model-value="handleAreaChange"
      >
        <SelectTrigger :class="{ 'border-destructive': errors.accommodation_area_id }">
          <SelectValue placeholder="Selecciona un área" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="area in areas" :key="area.id" :value="area.id">
            <div class="flex items-center gap-2">
              <span>{{ area.area_catalog?.label || 'Área sin nombre' }}</span>
              <Badge v-if="area.custom_label" variant="outline">
                {{ area.custom_label }}
              </Badge>
              <Badge v-if="area.room_number" variant="secondary"> #{{ area.room_number }} </Badge>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      <p v-if="errors.accommodation_area_id" class="text-sm font-medium text-destructive">
        {{ errors.accommodation_area_id }}
      </p>
      <p v-if="!accommodationId" class="text-xs text-muted-foreground">
        Selecciona primero un alojamiento
      </p>
    </div>

    <!-- Elemento -->
    <div class="space-y-2">
      <Label>Elemento *</Label>
      <Select
        :disabled="!areaId || selectedAreaElements(areaId, areas).length === 0"
        :model-value="elementId"
        @update:model-value="handleElementChange"
      >
        <SelectTrigger :class="{ 'border-destructive': errors.accommodation_element_id }">
          <SelectValue placeholder="Selecciona un elemento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="element in selectedAreaElements(areaId, areas)"
            :key="element.id"
            :value="element.id"
          >
            <div class="flex items-center gap-2">
              <span>{{ element.element_catalog?.name || 'Elemento sin nombre' }}</span>
              <Badge v-if="element.custom_name" variant="outline">
                {{ element.custom_name }}
              </Badge>
              <Badge
                v-if="element.condition"
                :variant="element.condition === 'good' ? 'default' : 'destructive'"
              >
                {{ element.condition }}
              </Badge>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      <p v-if="errors.accommodation_element_id" class="text-sm font-medium text-destructive">
        {{ errors.accommodation_element_id }}
      </p>
      <p v-if="!areaId" class="text-xs text-muted-foreground">Selecciona primero un área</p>
    </div>
  </div>
</template>
