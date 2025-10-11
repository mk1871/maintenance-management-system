<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  AlertCircle,
} from 'lucide-vue-next'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

import { accommodationService, type Accommodation } from '@/composables/accommodationService'
import { taskService, type Task } from '@/composables/taskService'
import TaskForm from '@/components/tasks/TaskForm.vue'

const route = useRoute()
const router = useRouter()

// Estado de datos
const accommodationId = route.params.id as string
const accommodation = ref<Accommodation | null>(null)
const tasks = ref<Task[]>([])
const isLoading = ref(true)

// Estado del dialog de nueva tarea
const showTaskFormDialog = ref(false)

// Diccionario de traducciones de áreas
const areaTranslations: Record<string, string> = {
  kitchen: 'Cocina',
  bathroom: 'Baño',
  bedroom: 'Habitación',
  living_room: 'Sala de estar',
  dining_room: 'Comedor',
  balcony: 'Balcón',
  terrace: 'Terraza',
  garden: 'Jardín',
  garage: 'Garaje',
  laundry: 'Lavandería',
  hallway: 'Pasillo',
  entrance: 'Entrada',
  window: 'Ventana',
  door: 'Puerta',
  roof: 'Techo',
  pool: 'Piscina',
  common_area: 'Área común',
}

/**
 * Áreas configuradas con traducción al español
 */
/**
 * Áreas configuradas con traducción al español
 */
const configuredAreasFormatted = computed(() => {
  if (!accommodation.value?.configured_areas) return []

  return Object.entries(accommodation.value.configured_areas).map(([key, elements]) => {
    const parts = key.split('_')
    const areaKey = parts[0]
    const roomNumber = parts[1]

    // Validar que areaKey existe antes de usarlo como índice
    let areaName = 'Área'
    if (areaKey && areaTranslations[areaKey]) {
      areaName = areaTranslations[areaKey]
    } else if (areaKey) {
      areaName = areaKey
    }

    if (roomNumber) {
      areaName = `${areaName} ${roomNumber}`
    }

    return {
      key,
      name: areaName,
      elements,
    }
  })
})

/**
 * Carga los datos del alojamiento y sus tareas
 */
const loadData = async (): Promise<void> => {
  try {
    isLoading.value = true
    const [accommodationData, tasksData] = await Promise.all([
      accommodationService.getById(accommodationId),
      taskService.getByAccommodationId(accommodationId),
    ])

    if (!accommodationData) {
      toast.error('Alojamiento no encontrado')
      router.push('/accommodations')
      return
    }

    accommodation.value = accommodationData
    tasks.value = tasksData
  } catch (error: unknown) {
    console.error(error)
    toast.error('Error al cargar los datos')
  } finally {
    isLoading.value = false
  }
}

/**
 * Abre el dialog para crear nueva tarea
 */
const openNewTaskDialog = (): void => {
  showTaskFormDialog.value = true
}

/**
 * Cierra el dialog de nueva tarea
 */
const closeTaskFormDialog = (): void => {
  showTaskFormDialog.value = false
}

/**
 * Maneja la creación exitosa de una tarea
 */
const handleTaskCreated = async (): Promise<void> => {
  closeTaskFormDialog()
  await loadData()
  toast.success('Tarea creada exitosamente')
}

/**
 * Abre el dialog de edición de alojamiento
 */
const openEditAccommodation = (): void => {
  // Navegar a la vista de alojamientos con query param para abrir edición
  router.push({
    name: 'Accommodations',
    query: { edit: accommodationId },
  })
}

/**
 * Genera reporte del alojamiento (placeholder)
 */
const generateReport = (): void => {
  toast.info('Funcionalidad de reportes en desarrollo')
  // TODO: Implementar con AWS S3
}

/**
 * Navega al detalle de una tarea
 */
const viewTaskDetail = (taskId: string): void => {
  router.push({ name: 'TaskDetail', params: { id: taskId } })
}

/**
 * Formatea una fecha
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Obtiene la variante del badge de estado de tarea
 */
const getTaskStatusVariant = (status: string): 'default' | 'secondary' | 'outline' => {
  const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
    pending: 'secondary',
    in_progress: 'default',
    completed: 'outline',
    cancelled: 'secondary',
  }
  return variants[status] ?? 'secondary'
}

/**
 * Traduce el estado de una tarea
 */
const translateStatus = (status: string): string => {
  const translations: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En Progreso',
    completed: 'Completada',
    cancelled: 'Cancelada',
  }
  return translations[status] ?? status
}

/**
 * Navega de vuelta a la lista de alojamientos
 */
const goBack = (): void => {
  router.push('/accommodations')
}

onMounted(async () => {
  await loadData()
})
</script>

<template>
  <div class="container mx-auto py-8 space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-6">
      <Skeleton class="h-12 w-full" />
      <Skeleton class="h-64 w-full" />
    </div>

    <!-- Empty State -->
    <div v-else-if="!accommodation" class="flex flex-col items-center justify-center py-12">
      <AlertCircle class="h-16 w-16 text-muted-foreground mb-4" />
      <h2 class="text-2xl font-bold">Alojamiento no encontrado</h2>
      <Button class="mt-4" @click="goBack">Volver a alojamientos</Button>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <Button size="icon" variant="outline" @click="goBack">
            <ArrowLeft class="h-4 w-4" />
          </Button>
          <div>
            <h1 class="text-3xl font-bold tracking-tight">
              {{ accommodation.code }} - {{ accommodation.name }}
            </h1>
            <p class="text-muted-foreground mt-1">
              {{ accommodation.address || 'Sin dirección' }}
            </p>
          </div>
        </div>
        <Badge :variant="accommodation.status === 'active' ? 'default' : 'secondary'">
          {{ accommodation.status === 'active' ? 'Activo' : 'Inactivo' }}
        </Badge>
      </div>

      <!-- Acciones Rápidas -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <DollarSign class="h-5 w-5" />
            Acciones
          </CardTitle>
        </CardHeader>
        <CardContent class="flex flex-wrap gap-2">
          <Button @click="openNewTaskDialog">
            <CheckCircle2 class="mr-2 h-4 w-4" />
            Crear Nueva Tarea
          </Button>
          <Button variant="outline" @click="openEditAccommodation">
            <Building2 class="mr-2 h-4 w-4" />
            Editar Alojamiento
          </Button>
          <Button variant="outline" @click="generateReport">
            <FileText class="mr-2 h-4 w-4" />
            Generar Reporte
          </Button>
        </CardContent>
      </Card>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Información General -->
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <Label class="text-muted-foreground">Código</Label>
                <p class="font-medium">{{ accommodation.code }}</p>
              </div>
              <div class="space-y-1">
                <Label class="text-muted-foreground">Estado</Label>
                <Badge :variant="accommodation.status === 'active' ? 'default' : 'secondary'">
                  {{ accommodation.status === 'active' ? 'Activo' : 'Inactivo' }}
                </Badge>
              </div>
            </div>
            <Separator />
            <div class="space-y-1">
              <Label class="text-muted-foreground">Dirección</Label>
              <p class="text-sm">{{ accommodation.address || 'No especificada' }}</p>
            </div>
            <div v-if="accommodation.notes" class="space-y-1">
              <Label class="text-muted-foreground">Notas</Label>
              <p class="text-sm">{{ accommodation.notes }}</p>
            </div>
            <Separator />
            <div class="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <span class="block">Creado:</span>
                <span class="font-medium">{{ formatDate(accommodation.created_at) }}</span>
              </div>
              <div>
                <span class="block">Actualizado:</span>
                <span class="font-medium">{{ formatDate(accommodation.updated_at) }}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Áreas Configuradas -->
        <Card>
          <CardHeader>
            <CardTitle>Áreas Configuradas</CardTitle>
            <CardDescription>
              {{ configuredAreasFormatted.length }} áreas con elementos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="configuredAreasFormatted.length > 0" class="space-y-3">
              <div
                v-for="area in configuredAreasFormatted"
                :key="area.key"
                class="border rounded-lg p-3"
              >
                <h4 class="font-semibold mb-2">{{ area.name }}</h4>
                <div class="flex flex-wrap gap-1">
                  <Badge v-for="(element, idx) in area.elements" :key="idx" variant="outline">
                    {{ element }}
                  </Badge>
                </div>
              </div>
            </div>
            <p v-else class="text-center text-muted-foreground py-4">No hay áreas configuradas</p>
          </CardContent>
        </Card>
      </div>

      <!-- Tareas Asociadas -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle class="flex items-center gap-2">
                <Clock class="h-5 w-5" />
                Tareas de Mantenimiento
              </CardTitle>
              <CardDescription>{{ tasks.length }} tareas registradas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="tasks.length > 0" class="space-y-2">
            <div
              v-for="task in tasks"
              :key="task.id"
              class="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
              @click="viewTaskDetail(task.id)"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <p class="font-medium">{{ task.description }}</p>
                  <p class="text-sm text-muted-foreground mt-1">
                    Vencimiento: {{ formatDate(task.due_date) }}
                  </p>
                </div>
                <Badge :variant="getTaskStatusVariant(task.status)">
                  {{ translateStatus(task.status) }}
                </Badge>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8">
            <p class="text-muted-foreground mb-4">No hay tareas registradas</p>
            <Button size="sm" @click="openNewTaskDialog">Crear Primera Tarea</Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Dialog de Nueva Tarea -->
    <TaskForm
      v-if="showTaskFormDialog"
      :default-accommodation-id="accommodationId"
      :is-open="showTaskFormDialog"
      @close="closeTaskFormDialog"
      @task-created="handleTaskCreated"
    />
  </div>
</template>
