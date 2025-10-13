<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { toast } from 'vue-sonner'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { TriangleAlert } from 'lucide-vue-next'

import AreaSelector, { type SelectedArea } from './AreaSelector.vue'
import AreaElementsConfig, { type SelectedElement } from './AreaElementsConfig.vue'

import { useAccommodationForm } from '@/composables/useAccommodationForm'
import { accommodationService } from '@/composables/accommodationService'
import { useAreaCatalogService } from '@/composables/areaCatalogService'
import type { AreaCatalog, ElementCatalog } from '@/composables/areaCatalogService'

const emit = defineEmits<{
  (e: 'accommodation-created'): void
}>()

interface FormData {
  code: string
  name: string
  address: string
  status: 'active' | 'inactive'
  notes: string
}

interface FormErrors {
  code: string
  name: string
}

const MIN_CODE_LENGTH = 1
const MAX_CODE_LENGTH = 4
const MIN_NAME_LENGTH = 3
const CODE_PATTERN = /^[A-Z0-9]+$/

const { getAreasWithElements } = useAreaCatalogService()
const { saveAreasAndElements, handleApiError } = useAccommodationForm()

const formData = ref<FormData>({
  code: '',
  name: '',
  address: '',
  status: 'active',
  notes: '',
})

const errors = ref<FormErrors>({
  code: '',
  name: '',
})

const areaCatalog = ref<AreaCatalog[]>([])
const selectedAreas = ref<SelectedArea[]>([])
const selectedElements = ref<SelectedElement[]>([])
const isDialogOpen = ref(false)
const isSubmitting = ref(false)

const elementCatalogMap = computed((): Map<string, ElementCatalog[]> => {
  const map = new Map<string, ElementCatalog[]>()
  areaCatalog.value.forEach((area) => {
    if ('elements' in area && Array.isArray(area.elements)) {
      map.set(area.id, area.elements as ElementCatalog[])
    }
  })
  return map
})

const areasWithoutElements = computed(() => {
  return selectedAreas.value.filter((area) => {
    return !selectedElements.value.some(
      (el) =>
        el.area_catalog_id === area.area_catalog_id &&
        (el.room_number === area.room_number || (!el.room_number && !area.room_number)),
    )
  })
})

const isFormValid = computed((): boolean => {
  return (
    !errors.value.code &&
    !errors.value.name &&
    formData.value.code.length >= MIN_CODE_LENGTH &&
    formData.value.name.length >= MIN_NAME_LENGTH &&
    selectedAreas.value.length > 0 &&
    areasWithoutElements.value.length === 0
  )
})

const validateCode = (): void => {
  const code = formData.value.code.trim()

  if (!code) {
    errors.value.code = 'El código es requerido'
    return
  }

  if (code.length < MIN_CODE_LENGTH || code.length > MAX_CODE_LENGTH) {
    errors.value.code = `El código debe tener entre ${MIN_CODE_LENGTH} y ${MAX_CODE_LENGTH} caracteres`
    return
  }

  if (!CODE_PATTERN.test(code)) {
    errors.value.code = 'Solo mayúsculas y números'
    return
  }

  errors.value.code = ''
}

const validateName = (): void => {
  const name = formData.value.name.trim()

  if (!name) {
    errors.value.name = 'El nombre es requerido'
    return
  }

  if (name.length < MIN_NAME_LENGTH) {
    errors.value.name = `El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres`
    return
  }

  errors.value.name = ''
}

const loadAreaCatalog = async (): Promise<void> => {
  try {
    const data = await getAreasWithElements()
    areaCatalog.value = data as AreaCatalog[]
  } catch (error: unknown) {
    handleApiError(error, 'cargar catálogo de áreas')
  }
}

const buildConfiguredAreas = (): Record<string, string[]> => {
  const config: Record<string, string[]> = {}
  selectedAreas.value.forEach((area) => {
    const key = area.room_number ? `${area.key}_${area.room_number}` : area.key
    config[key] = selectedElements.value
      .filter(
        (el) =>
          el.area_catalog_id === area.area_catalog_id &&
          (el.room_number === area.room_number || (!el.room_number && !area.room_number)),
      )
      .map((el) => el.element_name)
  })
  return config
}

const resetForm = (): void => {
  formData.value = {
    code: '',
    name: '',
    address: '',
    status: 'active',
    notes: '',
  }
  selectedAreas.value = []
  selectedElements.value = []
  errors.value.code = ''
  errors.value.name = ''
}

const handleCreate = async (): Promise<void> => {
  validateCode()
  validateName()

  if (!isFormValid.value) {
    if (selectedAreas.value.length === 0) {
      toast.error('Debes seleccionar al menos un área')
    } else if (areasWithoutElements.value.length > 0) {
      toast.error(
        `Las siguientes áreas necesitan elementos: ${areasWithoutElements.value.map((a) => a.label).join(', ')}`,
      )
    } else {
      toast.error('Por favor, corrige los errores del formulario')
    }
    return
  }

  isSubmitting.value = true

  try {
    const accommodation = await accommodationService.create({
      code: formData.value.code.trim().toUpperCase(),
      name: formData.value.name.trim(),
      address: formData.value.address?.trim() || undefined,
      status: formData.value.status,
      notes: formData.value.notes?.trim() || undefined,
      configured_areas: buildConfiguredAreas(),
    })

    if (selectedAreas.value.length > 0 && selectedElements.value.length > 0) {
      await saveAreasAndElements(accommodation.id, selectedAreas.value, selectedElements.value)
    }

    toast.success('Alojamiento creado exitosamente')
    emit('accommodation-created')
    resetForm()
    isDialogOpen.value = false
  } catch (error: unknown) {
    handleApiError(error, 'crear alojamiento')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  await loadAreaCatalog()
})
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
          Completa la información del nuevo alojamiento. Los campos marcados con * son obligatorios.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-6 py-4">
        <!-- Información Básica -->
        <div class="space-y-4 border rounded-md p-4">
          <h3 class="text-sm font-medium">Información Básica</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Código -->
            <div class="space-y-2">
              <Label for="code">
                Código *
                <span class="text-xs text-muted-foreground ml-2">(1-4 caracteres: A-Z, 0-9)</span>
              </Label>
              <Input
                id="code"
                v-model="formData.code"
                :class="{ 'border-destructive': errors.code }"
                maxlength="4"
                placeholder="Ej: GF01"
                @blur="validateCode"
                @input="formData.code = formData.code.toUpperCase()"
              />
              <p v-if="errors.code" class="text-sm font-medium text-destructive">
                {{ errors.code }}
              </p>
            </div>

            <!-- Nombre -->
            <div class="space-y-2">
              <Label for="name">Nombre *</Label>
              <Input
                id="name"
                v-model="formData.name"
                :class="{ 'border-destructive': errors.name }"
                placeholder="Ej: Apartamento Centro"
                @blur="validateName"
              />
              <p v-if="errors.name" class="text-sm font-medium text-destructive">
                {{ errors.name }}
              </p>
            </div>
          </div>

          <div class="space-y-2">
            <Label for="address">Dirección</Label>
            <Input
              id="address"
              v-model="formData.address"
              placeholder="Ej: Calle Mayor 123, Madrid"
            />
            <p class="text-xs text-muted-foreground">Opcional</p>
          </div>

          <div class="space-y-2">
            <Label for="status">Estado *</Label>
            <Select id="status" v-model="formData.status">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="notes">Notas</Label>
            <Textarea id="notes" v-model="formData.notes" placeholder="Observaciones..." rows="3" />
            <p class="text-xs text-muted-foreground">Opcional</p>
          </div>
        </div>

        <!-- Configuración de Áreas -->
        <div class="space-y-4 border rounded-md p-4">
          <h3 class="text-sm font-medium">Configuración de Áreas *</h3>
          <AreaSelector v-model="selectedAreas" :options="areaCatalog" />
          <p v-if="selectedAreas.length === 0" class="text-sm text-destructive">
            Debe seleccionar al menos un área
          </p>
        </div>

        <!-- Configuración de Elementos -->
        <div class="space-y-4 border rounded-md p-4">
          <h3 class="text-sm font-medium">Configuración de Elementos *</h3>
          <AreaElementsConfig
            v-model="selectedElements"
            :element-catalog="elementCatalogMap"
            :selected-areas="selectedAreas"
          />

          <!-- Mensaje específico por área sin elementos -->
          <div v-if="areasWithoutElements.length > 0" class="space-y-1 mt-3">
            <p
              v-for="area in areasWithoutElements"
              :key="`${area.area_catalog_id}-${area.room_number || 0}`"
              class="text-sm text-destructive flex items-center gap-2"
            >
              <TriangleAlert class="h-4 w-4 flex-shrink-0" />
              <span>{{ area.label }} no tiene elementos seleccionados</span>
            </p>
          </div>
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button type="button" variant="outline" @click="isDialogOpen = false">Cancelar</Button>
        <Button :disabled="!isFormValid || isSubmitting" type="submit" @click="handleCreate">
          <Spinner v-if="isSubmitting" class="h-4 w-4 mr-2" />
          {{ isSubmitting ? 'Creando...' : 'Crear Alojamiento' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
