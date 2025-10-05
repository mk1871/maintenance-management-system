<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button>
        <svg
          class="mr-2 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
          />
        </svg>
        Nueva Tarea
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Crear Nueva Tarea de Mantenimiento</DialogTitle>
        <DialogDescription>
          Complete los campos siguientes para crear una nueva tarea
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Accommodation selection -->
          <div class="space-y-2">
            <Label for="accommodation">Accommodation</Label>
            <Select v-model="formData.accommodation_id" @update:modelValue="onAccommodationChange">
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un accommodation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="acc in accommodations" :key="acc.id" :value="acc.id">
                  {{ acc.code }} - {{ acc.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Area selection -->
          <div class="space-y-2">
            <Label for="area">Área</Label>
            <Select v-model="formData.area" :disabled="!formData.accommodation_id">
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="area in areas" :key="area" :value="area">
                  {{ formatAreaName(area) }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Element selection -->
          <div class="space-y-2">
            <Label for="element">Elemento</Label>
            <Select v-model="formData.element" :disabled="!formData.area">
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un elemento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="element in elements" :key="element" :value="element">
                  {{ formatElementName(element) }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Priority selection -->
          <div class="space-y-2">
            <Label for="priority">Prioridad</Label>
            <Select v-model="formData.priority">
              <SelectTrigger>
                <SelectValue placeholder="Seleccione prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div class="flex items-center"><span class="mr-2">🟢</span> Baja</div>
                </SelectItem>
                <SelectItem value="medium">
                  <div class="flex items-center"><span class="mr-2">🟡</span> Media</div>
                </SelectItem>
                <SelectItem value="high">
                  <div class="flex items-center"><span class="mr-2">🔴</span> Alta</div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <Label for="description">Descripción del problema</Label>
          <Textarea
            id="description"
            v-model="formData.description"
            :class="{ 'border-destructive': errors.description }"
            placeholder="Describa detalladamente el problema detectado..."
            @blur="validateField('description')"
          />
          <p v-if="errors.description" class="text-sm text-destructive">{{ errors.description }}</p>
        </div>

        <!-- Due date -->
        <div class="space-y-2">
          <Label for="dueDate">Fecha de vencimiento</Label>
          <Input
            id="dueDate"
            v-model="formData.due_date"
            :class="{ 'border-destructive': errors.due_date }"
            type="date"
            @blur="validateField('due_date')"
          />
          <p v-if="errors.due_date" class="text-sm text-destructive">{{ errors.due_date }}</p>
        </div>

        <!-- Tags -->
        <div class="space-y-2">
          <Label for="tags">Etiquetas</Label>
          <div class="flex flex-wrap gap-2">
            <Badge
              v-for="tag in availableTags"
              :key="tag.id"
              :variant="formData.tags.includes(tag.id) ? 'default' : 'secondary'"
              class="cursor-pointer"
              @click="toggleTag(tag.id)"
            >
              {{ tag.name }}
            </Badge>
          </div>
        </div>

        <!-- Estimated cost -->
        <div class="space-y-2">
          <Label for="estimatedCost">Costo estimado (€)</Label>
          <Input
            id="estimatedCost"
            v-model="formData.estimated_cost"
            placeholder="0.00"
            step="0.01"
            type="number"
          />
        </div>
      </div>
      <DialogFooter>
        <Button :disabled="!isFormValid" @click="handleCreate">Crear Tarea</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import { computed, onBeforeMount, onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { type CreateTaskData, taskService } from '@/composables/taskService'
import { type Accommodation, accommodationService } from '@/composables/accommodationService'

// Definición de tipos para el formulario
interface TaskFormData {
  accommodation_id: string
  area: string
  element: string
  description: string
  priority: 'low' | 'medium' | 'high'
  due_date: string
  tags: string[]
  estimated_cost: string
}

interface Tag {
  id: string
  name: string
  color: string
}

// Importar toast
const toast = useToast()

// Datos que vienen del servicio
const accommodations = ref<Accommodation[]>([])
const tags = ref<Tag[]>([
  { id: '1', name: 'fontanería', color: '#3B82F6' },
  { id: '2', name: 'electricidad', color: '#EF4444' },
  { id: '3', name: 'pintura', color: '#EC4899' },
  { id: '4', name: 'urgente', color: '#DC2626' },
  { id: '5', name: 'preventivo', color: '#0891B2' },
])

// Estado del formulario
const formData = ref<TaskFormData>({
  accommodation_id: '',
  area: '',
  element: '',
  description: '',
  priority: 'medium',
  due_date: '',
  tags: [],
  estimated_cost: '',
})

const errors = reactive({
  description: '',
  due_date: '',
})

// Cargar accommodations cuando se monte el componente
onBeforeMount(async () => {
  try {
    accommodations.value = await accommodationService.getAll()
  } catch (error) {
    console.error('Error al cargar accommodations:', error)
    toast.error('Error al cargar accommodations')
  }
})

// Computed properties para áreas y elementos
const areas = computed(() => {
  if (!formData.value.accommodation_id) return []
  const accommodation = accommodations.value.find(
    (acc) => acc.id === formData.value.accommodation_id,
  )
  return accommodation ? Object.keys(accommodation.configured_areas || {}) : []
})

const elements = computed(() => {
  if (!formData.value.area || !formData.value.accommodation_id) return []
  const accommodation = accommodations.value.find(
    (acc) => acc.id === formData.value.accommodation_id,
  )
  return accommodation ? accommodation.configured_areas?.[formData.value.area] || [] : []
})

// Etiquetas disponibles
const availableTags = computed(() => tags.value)

// Validaciones
const validateField = (field: string) => {
  switch (field) {
    case 'description':
      if (!formData.value.description) {
        errors.description = 'Descripción requerida'
      } else if (formData.value.description.length < 10) {
        errors.description = 'Mínimo 10 caracteres'
      } else {
        errors.description = ''
      }
      break
    case 'due_date':
      if (!formData.value.due_date) {
        errors.due_date = 'Fecha de vencimiento requerida'
      } else if (new Date(formData.value.due_date) < new Date()) {
        errors.due_date = 'La fecha debe ser futura'
      } else {
        errors.due_date = ''
      }
      break
  }
}

// Formato para nombres de áreas y elementos
const formatAreaName = (area: string) => {
  const areaNames: Record<string, string> = {
    living_room: 'Sala de Estar',
    kitchen: 'Cocina',
    bathroom_1: 'Baño Principal',
    bathroom_2: 'Segundo Baño',
    bedroom_1: 'Dormitorio Principal',
    bedroom_2: 'Segundo Dormitorio',
    bedroom_3: 'Tercer Dormitorio',
    terrace: 'Terraza',
    garage: 'Garaje',
  }
  return areaNames[area] || area
}

const formatElementName = (element: string) => {
  const elementNames: Record<string, string> = {
    sofa: 'Sofá',
    tv: 'Televisión',
    table: 'Mesa',
    refrigerator: 'Refrigerador',
    stove: 'Estufa',
    sink: 'Fregadero',
    microwave: 'Microondas',
    toilet: 'Inodoro',
    shower: 'Ducha',
    bed: 'Cama',
    wardrobe: 'Ropero',
    nightstand: 'Mesita de noche',
  }
  return elementNames[element] || element
}

// Funciones del formulario
const toggleTag = (tagId: string) => {
  const index = formData.value.tags.indexOf(tagId)
  if (index > -1) {
    formData.value.tags.splice(index, 1)
  } else {
    formData.value.tags.push(tagId)
  }
}

const onAccommodationChange = () => {
  // Resetear área y elemento cuando cambia el accommodation
  formData.value.area = ''
  formData.value.element = ''
}

const isFormValid = computed(() => {
  return (
    formData.value.accommodation_id &&
    formData.value.area &&
    formData.value.element &&
    !errors.description &&
    !errors.due_date &&
    formData.value.description.length >= 10 &&
    formData.value.due_date
  )
})

const handleCreate = async () => {
  // Validar todos los campos
  validateField('description')
  validateField('due_date')

  if (!isFormValid.value) {
    return
  }

  try {
    // Preparar los datos para la creación
    const taskData: CreateTaskData = {
      accommodation_id: formData.value.accommodation_id,
      area: formData.value.area,
      element: formData.value.element,
      description: formData.value.description,
      priority: formData.value.priority,
      due_date: formData.value.due_date,
      notes: formData.value.description, // Usamos la descripción como notas también
      estimated_cost: formData.value.estimated_cost
        ? parseFloat(formData.value.estimated_cost)
        : undefined,
    }

    // Llamar al servicio para crear la tarea
    await taskService.create(taskData)

    // Mostrar mensaje de éxito
    toast.success('Tarea creada exitosamente')

    // Resetear formulario después de crear
    formData.value = {
      accommodation_id: '',
      area: '',
      element: '',
      description: '',
      priority: 'medium',
      due_date: '',
      tags: [],
      estimated_cost: '',
    }

    // Cerrar el diálogo (si es que se puede acceder al control del diálogo)
    // Aquí normalmente cerraríamos el diálogo
  } catch (error) {
    console.error('Error al crear tarea:', error)
    toast.error('Error al crear la tarea')
  }
}

onMounted(() => {
  // Inicializar fecha de vencimiento con un día en el futuro
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  formData.value.due_date = tomorrow.toISOString().split('T')[0]
})
</script>
