<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button>
        <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Nuevo Accommodation
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Crear Nuevo Accommodation</DialogTitle>
        <DialogDescription>
          Complete los campos siguientes para crear un nuevo accommodation
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="code" class="text-right">Código</Label>
          <Input 
            id="code" 
            v-model="formData.code" 
            class="col-span-3" 
            :class="{ 'border-destructive': errors.code }"
            @blur="validateField('code')"
          />
          <div v-if="errors.code" class="col-span-4 text-sm text-destructive text-right">
            {{ errors.code }}
          </div>
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="name" class="text-right">Nombre</Label>
          <Input 
            id="name" 
            v-model="formData.name" 
            class="col-span-3" 
            :class="{ 'border-destructive': errors.name }"
            @blur="validateField('name')"
          />
          <div v-if="errors.name" class="col-span-4 text-sm text-destructive text-right">
            {{ errors.name }}
          </div>
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="address" class="text-right">Dirección</Label>
          <Input id="address" v-model="formData.address" class="col-span-3" />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="status" class="text-right">Estado</Label>
          <Select v-model="formData.status">
            <SelectTrigger class="w-[180px]">
              <SelectValue placeholder="Seleccione un estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">Áreas</Label>
          <div class="col-span-3">
            <div v-for="area in areas" :key="area.value" class="flex items-center space-x-2 mb-2">
              <Checkbox :id="area.value" v-model="formData.areas[area.value]" />
              <Label :for="area.value">{{ area.label }}</Label>
            </div>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button @click="handleCreate" :disabled="isSubmitting">
          <span v-if="!isSubmitting">Crear Accommodation</span>
          <span v-else class="flex items-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Procesando...
          </span>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { accommodationService, type CreateAccommodationData } from '@/composables/accommodationService'

// Emitir evento cuando se cree un accommodation
const emit = defineEmits<{
  (e: 'accommodation-created'): void
}>()

// Toast para notificaciones
const toast = useToast()

// Definición de tipos para el formulario
interface AccommodationFormData {
  code: string
  name: string
  address: string
  status: 'active' | 'inactive'
  areas: Record<string, boolean>  // Áreas seleccionadas
}

// Definición de áreas disponibles
const areas = [
  { value: 'living_room', label: 'Sala de Estar' },
  { value: 'kitchen', label: 'Cocina' },
  { value: 'bathroom_1', label: 'Baño Principal' },
  { value: 'bathroom_2', label: 'Segundo Baño' },
  { value: 'bedroom_1', label: 'Dormitorio Principal' },
  { value: 'bedroom_2', label: 'Segundo Dormitorio' },
  { value: 'bedroom_3', label: 'Tercer Dormitorio' },
  { value: 'terrace', label: 'Terraza' },
  { value: 'garage', label: 'Garaje' },
]

// Estado del formulario
const formData = ref<AccommodationFormData>({
  code: '',
  name: '',
  address: '',
  status: 'active',
  areas: {
    living_room: false,
    kitchen: false,
    bathroom_1: false,
    bathroom_2: false,
    bedroom_1: false,
    bedroom_2: false,
    bedroom_3: false,
    terrace: false,
    garage: false,
  }
})

// Estado de errores
const errors = reactive({
  code: '',
  name: ''
})

// Estado de envío
const isSubmitting = ref(false)

// Validaciones
const validateField = (field: string) => {
  switch (field) {
    case 'code':
      if (!formData.value.code) {
        errors.code = 'Código requerido'
      } else if (formData.value.code.length < 2 || formData.value.code.length > 4) {
        errors.code = 'El código debe tener entre 2 y 4 caracteres'
      } else if (!/^[A-Z0-9]+$/.test(formData.value.code)) {
        errors.code = 'Solo letras mayúsculas y números'
      } else {
        errors.code = ''
      }
      break
    case 'name':
      if (!formData.value.name) {
        errors.name = 'Nombre requerido'
      } else if (formData.value.name.length < 3) {
        errors.name = 'Mínimo 3 caracteres'
      } else {
        errors.name = ''
      }
      break
  }
}

// Función para manejar la creación de un nuevo accommodation
const handleCreate = async () => {
  // Validar todos los campos
  validateField('code')
  validateField('name')
  
  // Verificar si hay errores
  const hasErrors = Object.values(errors).some(error => error !== '')
  if (hasErrors) {
    return
  }
  
  // Verificar que al menos una área esté seleccionada
  const hasSelectedAreas = Object.values(formData.value.areas).some(selected => selected)
  if (!hasSelectedAreas) {
    toast.error('Debe seleccionar al menos una área')
    return
  }
  
  try {
    isSubmitting.value = true
    
    // Preparar los datos para la creación
    const accommodationData: CreateAccommodationData = {
      code: formData.value.code.toUpperCase(),
      name: formData.value.name,
      address: formData.value.address,
      status: formData.value.status,
      configured_areas: {}
    }
    
    // Agregar las áreas seleccionadas
    for (const [area, selected] of Object.entries(formData.value.areas)) {
      if (selected) {
        // Aquí podrías definir elementos por defecto para cada área
        // o dejarlo vacío y permitir que se configuren después
        accommodationData.configured_areas[area] = getDefaultElementsForArea(area)
      }
    }
    
    // Llamar al servicio para crear el accommodation
    await accommodationService.create(accommodationData)
    
    // Mostrar mensaje de éxito
    toast.success('Accommodation creado exitosamente')
    
    // Emitir evento para que la vista padre actualice la lista
    emit('accommodation-created')
    
    // Resetear formulario después de crear
    formData.value = {
      code: '',
      name: '',
      address: '',
      status: 'active',
      areas: {
        living_room: false,
        kitchen: false,
        bathroom_1: false,
        bathroom_2: false,
        bedroom_1: false,
        bedroom_2: false,
        bedroom_3: false,
        terrace: false,
        garage: false,
      }
    }
    
    // Resetear errores
    errors.code = ''
    errors.name = ''
  } catch (error: any) {
    console.error('Error al crear accommodation:', error)
    toast.error(error?.message || 'Error al crear el accommodation')
  } finally {
    isSubmitting.value = false
  }
}

// Función para obtener elementos por defecto para cada área
const getDefaultElementsForArea = (area: string): string[] => {
  const defaultElements: Record<string, string[]> = {
    'living_room': ['sofa', 'tv', 'table'],
    'kitchen': ['refrigerator', 'stove', 'sink', 'microwave'],
    'bathroom_1': ['toilet', 'sink', 'shower'],
    'bathroom_2': ['toilet', 'sink', 'shower'],
    'bedroom_1': ['bed', 'wardrobe', 'nightstand'],
    'bedroom_2': ['bed', 'wardrobe', 'nightstand'],
    'bedroom_3': ['bed', 'wardrobe', 'nightstand'],
    'terrace': ['table', 'chairs'],
    'garage': ['door', 'light']
  }
  
  return defaultElements[area] || []
}
</script>