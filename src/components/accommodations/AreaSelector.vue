<script lang="ts" setup>
import { ref, watch } from 'vue'
import { Label } from '@/components/ui/label'

// Interfaces
interface AreaOption {
  value: string
  label: string
}

// Props
const props = defineProps<{
  options: AreaOption[]
  modelValue: string[]
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const selectedAreas = ref<string[]>([...props.modelValue])

/**
 * Sincroniza cambios con el padre
 */
watch(
  selectedAreas,
  (newValue) => {
    emit('update:modelValue', newValue)
  },
  { deep: true }
)

/**
 * Maneja el toggle de un área
 */
const handleToggle = (areaKey: string, checked: boolean): void => {
  if (checked) {
    if (!selectedAreas.value.includes(areaKey)) {
      selectedAreas.value.push(areaKey)
    }
  } else {
    selectedAreas.value = selectedAreas.value.filter((key) => key !== areaKey)
  }
}

/**
 * Verifica si un área está seleccionada
 */
const isSelected = (areaKey: string): boolean => {
  return selectedAreas.value.includes(areaKey)
}
</script>

<template>
  <div class="space-y-2">
    <Label>Áreas del Alojamiento *</Label>
    <p class="text-sm text-muted-foreground mb-2">
      Selecciona las áreas que tiene este alojamiento
    </p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded-md p-4">
      <div
        v-for="option in options"
        :key="option.value"
        class="flex items-center space-x-2"
      >
        <input
          :id="`area-${option.value}`"
          :checked="isSelected(option.value)"
          class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 cursor-pointer"
          type="checkbox"
          @change="(e) => handleToggle(option.value, (e.target as HTMLInputElement).checked)"
        />
        <Label :for="`area-${option.value}`" class="cursor-pointer text-sm font-normal">
          {{ option.label }}
        </Label>
      </div>
    </div>
    <p class="text-xs text-muted-foreground">
      Áreas seleccionadas: {{ selectedAreas.length }}
    </p>
  </div>
</template>
