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
          <Input id="code" v-model="formData.code" class="col-span-3" />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="name" class="text-right">Nombre</Label>
          <Input id="name" v-model="formData.name" class="col-span-3" />
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
        <Button @click="handleCreate">Crear Accommodation</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

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

// Función para manejar la creación de un nuevo accommodation
const handleCreate = () => {
  // Aquí iría la lógica para crear el accommodation
  console.log('Creando accommodation:', formData.value)
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
}
</script>