<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from '@/components/ui/sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { accommodationService, type Accommodation } from '@/composables/accommodationService'
import { taskService, type Task } from '@/composables/taskService'
import { costService } from '@/composables/costService'

// Variables
const route = useRoute()
const router = useRouter()

const accommodationId = ref(route.params.id as string)
const accommodation = ref<Accommodation | null>(null)
const recentTasks = ref<Task[]>([])
const summary = ref({
  pendingTasks: 0,
  inProgressTasks: 0,
  completedTasks: 0,
  totalCost: 0
})
const loading = ref(true)

// Funciones para formatear datos
const formatStatus = (status: string) => {
  const statusNames: Record<string, string> = {
    'active': 'Activo',
    'inactive': 'Inactivo',
    'pending': 'Pendiente',
    'in_progress': 'En Progreso',
    'completed': 'Completada',
    'cancelled': 'Cancelada'
  }
  return statusNames[status] || status
}

const getStatusVariant = (status: string) => {
  const variants: Record<string, string> = {
    'active': 'default',
    'inactive': 'secondary',
    'pending': 'secondary',
    'in_progress': 'default',
    'completed': 'success',
    'cancelled': 'destructive'
  }
  return variants[status] || 'default'
}

const formatAreaName = (area: string) => {
  const areaNames: Record<string, string> = {
    'living_room': 'Sala de Estar',
    'kitchen': 'Cocina',
    'bathroom_1': 'Baño Principal',
    'bathroom_2': 'Segundo Baño',
    'bedroom_1': 'Dormitorio Principal',
    'bedroom_2': 'Segundo Dormitorio',
    'bedroom_3': 'Tercer Dormitorio',
    'terrace': 'Terraza',
    'garage': 'Garaje'
  }
  return areaNames[area] || area
}

const formatPriority = (priority: string) => {
  const priorityNames: Record<string, string> = {
    'low': 'Baja',
    'medium': 'Media',
    'high': 'Alta'
  }
  return priorityNames[priority] || priority
}

const getTaskPriorityBorder = (priority: string) => {
  const borders: Record<string, string> = {
    'low': 'border-green-500',
    'medium': 'border-yellow-500',
    'high': 'border-red-500'
  }
  return borders[priority] || 'border-gray-500'
}

// Cargar datos del accommodation
const loadAccommodationData = async () => {
  try {
    loading.value = true
    
    // Cargar el accommodation
    const accData = await accommodationService.getById(accommodationId.value)
    if (!accData) {
      toast.error('Accommodation no encontrado')
      return
    }
    
    accommodation.value = accData
    
    // Cargar tareas recientes
    recentTasks.value = await taskService.getAll()
    recentTasks.value = recentTasks.value
      .filter(task => task.accommodation_id === accommodationId.value)
      .slice(0, 5) // Limitar a las 5 más recientes
    
    // Calcular resumen
    await calculateSummary()
  } catch (error) {
    console.error('Error al cargar los datos del accommodation:', error)
    toast.error('Error al cargar los datos del accommodation')
  } finally {
    loading.value = false
  }
}

// Calcular resumen
const calculateSummary = async () => {
  try {
    // Obtener todas las tareas del accommodation
    const tasks = await taskService.getAll()
    const accommodationTasks = tasks.filter(task => task.accommodation_id === accommodationId.value)
    
    // Calcular conteos por estado
    summary.value.pendingTasks = accommodationTasks.filter(task => task.status === 'pending').length
    summary.value.inProgressTasks = accommodationTasks.filter(task => task.status === 'in_progress').length
    summary.value.completedTasks = accommodationTasks.filter(task => task.status === 'completed').length
    
    // Calcular costo total
    const costs = await costService.getAll()
    const accommodationCosts = costs.filter(cost => cost.accommodation_id === accommodationId.value)
    summary.value.totalCost = accommodationCosts.reduce((sum, cost) => sum + cost.amount, 0)
  } catch (error) {
    console.error('Error al calcular el resumen:', error)
    toast.error('Error al calcular el resumen')
  }
}

// Acciones
const createNewTask = () => {
  // Redirigir a la creación de tarea con este accommodation preseleccionado
  router.push(`/tasks/new?accommodation=${accommodationId.value}`)
}

const editAccommodation = () => {
  // Redirigir a la edición del accommodation
  router.push(`/accommodations/${accommodationId.value}/edit`)
}

const goBack = () => {
  router.push('/accommodations')
}

// Cargar datos cuando se monte el componente
onMounted(async () => {
  await loadAccommodationData()
})
</script>

<template>
  <div class="container mx-auto py-6">
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
    <div v-else-if="!accommodation" class="text-center py-12">
      <h2 class="text-2xl font-bold text-foreground">Accommodation no encontrado</h2>
      <Button class="mt-4" @click="goBack">Volver a accommodations</Button>
    </div>
    <div v-else>
      <div class="flex items-center mb-6">
        <Button variant="outline" class="mr-4" @click="goBack">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Button>
        <h1 class="text-3xl font-bold text-foreground">{{ accommodation.code }} - {{ accommodation.name }}</h1>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <Card class="mb-6">
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                <div>
                  <Label class="text-sm font-medium text-muted-foreground">Código</Label>
                  <p class="text-foreground">{{ accommodation.code }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium text-muted-foreground">Nombre</Label>
                  <p class="text-foreground">{{ accommodation.name }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium text-muted-foreground">Dirección</Label>
                  <p class="text-foreground">{{ accommodation.address || 'N/A' }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium text-muted-foreground">Estado</Label>
                  <Badge :variant="getStatusVariant(accommodation.status)" class="ml-2">
                    {{ formatStatus(accommodation.status) }}
                  </Badge>
                </div>
                <div>
                  <Label class="text-sm font-medium text-muted-foreground">Áreas Configuradas</Label>
                  <div class="mt-2 flex flex-wrap gap-2">
                    <Badge 
                      v-for="(elements, area) in accommodation.configured_areas" 
                      :key="area" 
                      variant="outline"
                    >
                      {{ formatAreaName(area) }} ({{ elements.length }} elementos)
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Tareas Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div v-if="recentTasks && recentTasks.length > 0" class="space-y-4">
                <div 
                  v-for="task in recentTasks" 
                  :key="task.id" 
                  class="border-l-4 pl-4 py-2" 
                  :class="getTaskPriorityBorder(task.priority)"
                >
                  <h3 class="font-medium text-foreground">{{ task.description }}</h3>
                  <p class="text-sm text-muted-foreground">
                    Prioridad: {{ formatPriority(task.priority) }} • Estado: {{ formatStatus(task.status) }}
                  </p>
                </div>
              </div>
              <div v-else class="text-center py-4 text-muted-foreground">
                No hay tareas registradas
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card class="mb-6">
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Tareas Pendientes</span>
                  <span class="font-medium">{{ summary.pendingTasks }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Tareas en Progreso</span>
                  <span class="font-medium">{{ summary.inProgressTasks }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Tareas Completadas</span>
                  <span class="font-medium">{{ summary.completedTasks }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Costo Total</span>
                  <span class="font-medium">€{{ summary.totalCost.toFixed(2) }}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-3">
                <Button class="w-full" @click="createNewTask">
                  Crear Nueva Tarea
                </Button>
                <Button variant="outline" class="w-full" @click="editAccommodation">
                  Editar Accommodation
                </Button>
                <Button variant="outline" class="w-full">
                  Generar Reporte
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
