<script lang="ts" setup>
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Plus, X } from 'lucide-vue-next'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// Interfaces
export interface AreaConfig {
  key: string
  label: string
  elements: string[]
}

interface AreaWithInput extends AreaConfig {
  newElement: string
}

// Props
const props = defineProps<{
  areas: AreaConfig[]
}>()

// Emits
const emit = defineEmits<{
  'update:areas': [value: AreaConfig[]]
}>()

const localAreas = ref<AreaWithInput[]>(
  props.areas.map((area) => ({
    ...area,
    newElement: '',
  })),
)

/**
 * Sincroniza cambios con el padre
 */
watch(
  localAreas,
  (newValue) => {
    const cleanedAreas = newValue.map(({ key, label, elements }) => ({
      key,
      label,
      elements,
    }))
    emit('update:areas', cleanedAreas)
  },
  { deep: true },
)

/**
 * Sincroniza cuando el padre cambia las áreas
 */
watch(
  () => props.areas,
  (newAreas) => {
    const existingKeys = localAreas.value.map((a) => a.key)
    const newKeys = newAreas.map((a) => a.key)

    // Agregar nuevas áreas
    newAreas.forEach((area) => {
      if (!existingKeys.includes(area.key)) {
        localAreas.value.push({
          ...area,
          newElement: '',
        })
      }
    })

    // Remover áreas eliminadas
    localAreas.value = localAreas.value.filter((area) => newKeys.includes(area.key))
  },
  { deep: true },
)
/**
 * Agrega un elemento a un área
 */
const addElement = (areaIndex: number): void => {
  const area = localAreas.value[areaIndex]

  if (!area) {
    console.error('Área no encontrada en el índice:', areaIndex)
    return
  }

  const element = area.newElement.trim()

  if (!element) {
    toast.error('El nombre del elemento no puede estar vacío')
    return
  }

  if (area.elements.includes(element)) {
    toast.error('Este elemento ya existe en el área')
    return
  }

  area.elements.push(element)

  // Limpiar el input
  setTimeout(() => {
    if (localAreas.value[areaIndex]) {
      localAreas.value[areaIndex].newElement = ''
    }
  }, 0)
}

/**
 * Elimina un elemento de un área
 */
const removeElement = (areaIndex: number, elementIndex: number): void => {
  const area = localAreas.value[areaIndex]

  if (!area) {
    console.error('Área no encontrada en el índice:', areaIndex)
    return
  }

  area.elements.splice(elementIndex, 1)
}
</script>

<template>
  <div v-if="localAreas.length > 0" class="space-y-4">
    <div class="flex items-center justify-between">
      <Label>Configurar Elementos *</Label>
      <p class="text-xs text-muted-foreground">Cada área debe tener al menos un elemento</p>
    </div>

    <div class="space-y-4 border rounded-md p-4 max-h-[400px] overflow-y-auto">
      <div
        v-for="(area, areaIndex) in localAreas"
        :key="area.key"
        class="space-y-3 pb-4 border-b last:border-b-0 last:pb-0"
      >
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-medium">
            {{ area.label }}
            <span class="text-xs text-muted-foreground ml-2">
              ({{ area.elements.length }} elemento{{ area.elements.length !== 1 ? 's' : '' }})
            </span>
          </h4>
        </div>

        <!-- Lista de elementos -->
        <div v-if="area.elements.length > 0" class="flex flex-wrap gap-2">
          <div
            v-for="(element, elementIndex) in area.elements"
            :key="elementIndex"
            class="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
          >
            <span>{{ element }}</span>
            <button
              class="hover:text-destructive transition-colors"
              type="button"
              @click="removeElement(areaIndex, elementIndex)"
            >
              <X class="h-3 w-3" />
            </button>
          </div>
        </div>

        <!-- Mensaje si no hay elementos -->
        <p v-else class="text-sm text-muted-foreground italic">No hay elementos configurados</p>

        <!-- Agregar nuevo elemento -->
        <div class="flex gap-2">
          <Input
            v-model="area.newElement"
            class="flex-1"
            placeholder="Ej: Sofá, Refrigerador, Cama..."
            @keyup.enter="addElement(areaIndex)"
          />
          <Button size="sm" type="button" variant="outline" @click="addElement(areaIndex)">
            <Plus class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
